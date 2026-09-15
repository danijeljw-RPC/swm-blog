# Cloudflare DEV and PROD Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Produce and validate two Cloudflare Worker deployments with no shared mutable DEV/PROD infrastructure.

**Architecture:** Wrangler `dev` and `prod` environments are flattened by Astro at build time and deployed from the generated configuration. D1, session KV, Turnstile, secrets, Access audiences, routes, host validation, and branch entry points are explicit and isolated.

**Tech Stack:** Astro 7, `@astrojs/cloudflare`, Wrangler 4.130, Cloudflare Workers, D1, KV, Turnstile, Access, Bash, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-14-cloudflare-dev-prod-isolation-design.md`

## Global Constraints

- Preserve one canonical `migrations/` history and apply it independently.
- Never print or commit secrets.
- Preserve unrelated working-tree changes.
- Do not deploy until generated configuration and dry-run validation pass.
- DEV uses only `swm-blog-dev`; PROD uses only `swm-blog-prod`.

---

### Task 1: Integrate and verify admin security

**Files:** Integrate the existing `codex/submissions-admin` commits and their tests.

- [ ] Cherry-pick the completed admin commits onto `dev` while preserving the workflow deletion.
- [ ] Run the focused admin tests and verify anonymous/malformed Access requests fail closed.
- [ ] Inspect every admin route and confirm all routes pass through middleware.

### Task 2: Define executable environment contracts with tests

**Files:** Modify `tests/submission-configuration.test.ts`; create a CI-script integration test if needed; modify `wrangler.jsonc`, `package.json`, and `astro.config.mjs`.

- [ ] Write tests that fail for old environment names, shared/missing SESSION KV, localhost in deployed hosts, placeholder IDs, and wrong branch execution.
- [ ] Run focused tests and observe the expected failures.
- [ ] Implement explicit `dev` and `prod` bindings, names, variables, routes, and environment-aware Astro site configuration.
- [ ] Run focused and full tests.

### Task 3: Split build and deploy scripts

**Files:** Create `scripts/ci-build-dev.sh`, `scripts/ci-build-prod.sh`, `scripts/ci-deploy-dev.sh`, `scripts/ci-deploy-prod.sh`; delete `scripts/ci-build.sh` and `scripts/ci-deploy.sh`; update repository references.

- [ ] Add branch-guard behavior tests and observe failure before scripts exist.
- [ ] Implement four scripts with strict generated-config identity and binding checks.
- [ ] Make all scripts executable and verify shell syntax and wrong-branch behavior.

### Task 4: Reconcile Cloudflare resources

**Files:** Update `wrangler.jsonc` with verified IDs only.

- [ ] Reuse both existing D1 databases and `swm-blog-dev`.
- [ ] Create missing DEV and PROD session KV namespaces without automatic config rewriting.
- [ ] Inspect or create hostname-restricted DEV and PROD Turnstile widgets under the required secret-handling safeguards.
- [ ] Apply the canonical migrations independently and verify equivalent migration state.

### Task 5: Build and package independently

**Files:** Generated `dist/server/wrangler.json` is inspected but never committed.

- [ ] Run test, check, content validation, and DEV build.
- [ ] Assert DEV generated Worker name, D1 ID, KV ID, vars, and route contain no PROD mutable binding.
- [ ] Run a Wrangler upload dry run using DEV generated configuration.
- [ ] Clean and repeat all generated-config assertions and dry run for PROD.

### Task 6: Configure secrets, Workers, routes, and Access

**Files:** No secret-bearing files.

- [ ] Create Workers through validated uploads and set separate rate-limit and Turnstile secrets through standard input.
- [ ] Configure custom domains/routes where the zone and API permit.
- [ ] Inspect Access account metadata and create environment-specific applications/policies only with known approved email identities and sufficient permissions.
- [ ] Verify secret names, routes, deployment identities, and anonymous admin denial.

### Task 7: Final audit

**Files:** Update deployment documentation if dashboard-only Workers Builds settings remain.

- [ ] Run full tests, check, content validation, both builds, both dry runs, `git diff --check`, and migration/resource inspections.
- [ ] Compare every invariant in the task against repository and remote evidence.
- [ ] Report created, reused, deployed, blocked, and intentionally shared resources without secret values.
