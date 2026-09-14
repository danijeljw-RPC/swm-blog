# Submissions Admin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Cloudflare Access-protected Astro admin workspace for filtering, reading, and changing the lifecycle status of persisted story and guest submissions.

**Architecture:** Cloudflare Access remains the authorization policy engine, while Astro middleware independently verifies the Access JWT for every `/admin` request and attaches its verified identity to request locals. Server-rendered routes use a focused D1 admin repository for bounded reads and parameterized updates; mutations stay beneath `/admin/*`, validate origin, and use POST/redirect/GET.

**Tech Stack:** Astro 7 server routes, Cloudflare Workers, Cloudflare Access, `jose`, Cloudflare D1, TypeScript, Node test runner, CSS using the existing Sisters with Mirrors tokens.

**Spec:** `docs/superpowers/specs/2026-09-14-submissions-admin-design.md`

## Global Constraints

- Cloudflare Zero Trust Access with email One-Time PIN protects `/admin` and `/admin/*` at the edge.
- Exact administrator emails remain only in Cloudflare Access policies; never store or hard-code an allowlist.
- Astro must verify the `Cf-Access-Jwt-Assertion` signature, issuer, audience, time claims, and non-empty email claim.
- Missing or invalid authentication fails closed; production code has no local authentication bypass.
- All admin HTML and mutation responses are private, non-cacheable, and excluded from indexing.
- All SQL is parameterized; all filters, references, pages, and statuses are parsed through closed validation functions.
- The supported lifecycle is `new`, `reviewing`, `contacted`, `shortlisted`, `scheduled`, `declined`, `used`, and `archived`.
- Use the existing `SUBMISSIONS_DB` binding and migration system; do not add another database or backend.
- Do not render arbitrary submitted HTML or fetch user-supplied URLs.
- Preserve all unrelated working-tree changes, including `public/data/locations/manifest.json`.
- Final checks accept zero warnings.

---

### Task 1: Cloudflare Access verification boundary

**Files:**
- Create: `src/lib/admin/access.ts`
- Create: `src/middleware.ts`
- Create: `src/env.d.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `wrangler.jsonc`
- Test: `tests/admin-access.test.ts`
- Test: `tests/admin-configuration.test.ts`

**Interfaces:**
- Produces: `verifyAccessRequest(request, config, verifier?): Promise<AdminIdentity>` where `AdminIdentity` is `{ email: string; subject: string }` and `AccessConfig` is `{ teamDomain: string; audience: string }`.
- Produces: `App.Locals.adminIdentity?: AdminIdentity` for authenticated admin handlers.
- Consumes: generated `Cloudflare.Env` values `CLOUDFLARE_ACCESS_TEAM_DOMAIN` and `CLOUDFLARE_ACCESS_AUD`.

- [ ] **Step 1: Add failing verifier and middleware contract tests**

Create `tests/admin-access.test.ts` with table-driven tests asserting that `verifyAccessRequest` rejects a missing assertion, missing configuration, issuer mismatch, audience mismatch, expired token, and missing email. Generate an ephemeral RS256 key pair with `jose`, sign real JWTs, and inject `createLocalJWKSet({ keys: [publicJwk] })` as the verifier. Assert a valid JWT returns its verified `email` and `sub`.

Add source assertions that `src/middleware.ts` matches both `pathname === "/admin"` and `pathname.startsWith("/admin/")`, assigns `context.locals.adminIdentity`, returns 403 on verification failure, and adds `Cache-Control: private, no-store` plus `X-Robots-Tag: noindex, nofollow` to successful admin responses.

- [ ] **Step 2: Run the focused tests and confirm the missing-module failure**

Run: `node --import tsx --test tests/admin-access.test.ts`

Expected: FAIL because `src/lib/admin/access.ts` and `src/middleware.ts` do not exist.

- [ ] **Step 3: Install `jose` and implement the verifier**

Run: `npm install jose`

Implement `src/lib/admin/access.ts` with `createRemoteJWKSet(new URL("/cdn-cgi/access/certs", normalizedTeamDomain))` and `jwtVerify(token, verifier, { issuer: normalizedTeamDomain, audience })`. Require an HTTPS team domain whose hostname ends in `.cloudflareaccess.com`, a non-empty audience, the assertion header, `payload.email`, and `payload.sub`. Do not decode or trust claims before successful verification. Convert all validation failures to a single exported `AccessDeniedError` without logging tokens.

- [ ] **Step 4: Implement fail-closed Astro middleware and locals typing**

Define `App.Locals.adminIdentity` in `src/env.d.ts`. In `src/middleware.ts`, pass public routes through unchanged. For the admin root and descendants, call `verifyAccessRequest` using `env.CLOUDFLARE_ACCESS_TEAM_DOMAIN` and `env.CLOUDFLARE_ACCESS_AUD`; on failure return a plain generic 403. On success assign the verified identity, call `next()`, and set the private/no-store and noindex headers on the returned response.

- [ ] **Step 5: Add failing configuration tests, then declare Access settings**

In `tests/admin-configuration.test.ts`, parse `wrangler.jsonc` and assert the base, development, and production configurations declare non-empty `CLOUDFLARE_ACCESS_TEAM_DOMAIN` and `CLOUDFLARE_ACCESS_AUD` values whose environment values can differ. Add descriptive replace-before-deploy values to `wrangler.jsonc`; do not put administrator emails in config. Regenerate bindings with `npx wrangler types` and ensure `Cloudflare.Env` contains both keys.

- [ ] **Step 6: Verify and commit the authentication boundary**

Run:

```bash
node --import tsx --test tests/admin-access.test.ts tests/admin-configuration.test.ts
npm run check
git diff --check
```

Expected: all focused tests pass and Astro reports zero diagnostics.

Commit:

```bash
git add package.json package-lock.json wrangler.jsonc worker-configuration.d.ts src/env.d.ts src/middleware.ts src/lib/admin/access.ts tests/admin-access.test.ts tests/admin-configuration.test.ts
git commit -m "feat: verify Cloudflare Access for admin routes"
```

### Task 2: Admin submission model, migration, and D1 repository

**Files:**
- Create: `src/lib/admin/submissions.ts`
- Create: `src/lib/admin/repository.ts`
- Create: `migrations/0002_add_submission_admin_fields.sql`
- Modify: `src/lib/submissions/types.ts`
- Test: `tests/admin-submissions.test.ts`
- Test: `tests/submission-migration.test.ts`

**Interfaces:**
- Produces: `SUBMISSION_STATUSES`, `AdminSubmissionStatus`, `AdminSubmissionFilter`, `parseSubmissionFilter(value)`, `parsePage(value)`, `parseSubmissionStatus(value)`, and `normalizePublicReference(value)`.
- Produces: `D1AdminSubmissionRepository.list({ filter, page, pageSize }): Promise<SubmissionPage>`, `.findByReference(reference): Promise<AdminSubmissionDetail | null>`, and `.updateStatus({ reference, status, administratorEmail, updatedAt }): Promise<boolean>`.
- Consumes: the existing `SUBMISSIONS_DB` schema and `DeliveryState` definitions.

- [ ] **Step 1: Write failing parser and repository tests**

Create `tests/admin-submissions.test.ts`. Assert each requested filter parses, unknown filters fall back to `all`, page values are positive bounded integers, every lifecycle status parses, unknown statuses return an invalid result, and references normalize to uppercase only when they match `SWM-[SG]-[A-Z0-9]{6}`.

Use a focused fake `D1Database` statement recorder to assert list queries bind filter values, use `LIMIT ? OFFSET ?`, order by `created_at DESC, id DESC`, and never interpolate query-string input. Assert detail lookup binds one normalized reference. Assert status updates bind status, ISO time, verified administrator email, and reference, returning false when no row changed.

- [ ] **Step 2: Run focused tests and verify they fail for missing admin modules**

Run: `node --import tsx --test tests/admin-submissions.test.ts`

Expected: FAIL because the parser and repository modules do not exist.

- [ ] **Step 3: Define admin domain types and pure parsers**

Implement the closed values in `src/lib/admin/submissions.ts`. Define discriminated detail types for story and guest records, a compact `SubmissionListItem`, and `SubmissionPage` with `items`, `page`, `pageSize`, `total`, and `totalPages`. Parse JSON array columns defensively into string arrays without accepting objects or executable content.

Update `StoredSubmission.status` in `src/lib/submissions/types.ts` from the literal `"new"` to the shared lifecycle type while preserving new submission creation as `new`.

- [ ] **Step 4: Add the migration test, then write the migration**

Create `tests/submission-migration.test.ts` asserting migration `0002` adds nullable `updated_at TEXT` and `status_updated_by TEXT` columns and indexes `(status, created_at DESC)` plus `(kind, submission_type, created_at DESC)`.

Create `migrations/0002_add_submission_admin_fields.sql` using `ALTER TABLE` for the two columns and `CREATE INDEX IF NOT EXISTS` for the supporting indexes. Do not rebuild or delete existing submission data.

- [ ] **Step 5: Implement the D1 repository**

Build SQL from a fixed internal map keyed by the parsed filter. Use `COUNT(*)` and a bounded select for the index. Map `stories` to `kind = 'story' AND submission_type = 'story'`, `questions` to `submission_type = 'question'`, `topics` to `submission_type = 'topic'`, and `guests` to `kind = 'guest'`; map lifecycle tabs to exact statuses. Join or separately query `email_deliveries` for detail delivery states. Return null for malformed stored rows rather than emitting unsafely typed data.

- [ ] **Step 6: Verify and commit the data layer**

Run:

```bash
node --import tsx --test tests/admin-submissions.test.ts tests/submission-migration.test.ts tests/submission-service.test.ts
npm run check
git diff --check
```

Commit:

```bash
git add migrations/0002_add_submission_admin_fields.sql src/lib/admin/submissions.ts src/lib/admin/repository.ts src/lib/submissions/types.ts tests/admin-submissions.test.ts tests/submission-migration.test.ts
git commit -m "feat: add submission admin data layer"
```

### Task 3: Filterable submissions index

**Files:**
- Create: `src/components/admin/AdminShell.astro`
- Create: `src/components/admin/StatusBadge.astro`
- Create: `src/components/admin/SubmissionList.astro`
- Create: `src/pages/admin/submissions/index.astro`
- Create: `src/styles/admin.css`
- Test: `tests/admin-pages.test.ts`

**Interfaces:**
- Consumes: `Astro.locals.adminIdentity`, `parseSubmissionFilter`, `parsePage`, and `D1AdminSubmissionRepository.list`.
- Produces: a server-rendered index whose filter URLs are `/admin/submissions/?filter=<value>&page=<number>`.

- [ ] **Step 1: Write the failing index-page contract test**

Create `tests/admin-pages.test.ts` and assert the index imports the admin repository, reads only parsed `filter` and `page` values, and contains links labelled All, New, Stories, Questions, Topic Suggestions, Guest Requests, Contacted, Scheduled, Used, and Archived. Assert it renders public reference, category, identity, received date, status, permission summary, and excerpt through `SubmissionList`, includes previous/next links only from bounded pagination metadata, and has a useful empty state.

- [ ] **Step 2: Run the contract test and verify it fails**

Run: `node --import tsx --test tests/admin-pages.test.ts`

Expected: FAIL because the admin page and components do not exist.

- [ ] **Step 3: Build the shared admin presentation**

Implement `AdminShell.astro` with the existing `BaseLayout`, a compact left-aligned heading, the verified administrator email, and a content slot. Import `admin.css` only through this shell. Implement `StatusBadge.astro` with text labels in addition to restrained status colors. Implement `SubmissionList.astro` with semantic links and `<time datetime>` values; use CSS grid so rows collapse into labelled cards below 48rem.

- [ ] **Step 4: Implement the server-rendered index**

Set `prerender = false`. Require `Astro.locals.adminIdentity`; initialize `D1AdminSubmissionRepository` with `env.SUBMISSIONS_DB`; parse `Astro.url.searchParams`; load 25 records per page; and render the fixed filter navigation. A database failure returns Astro's generic server error path after structured logging that contains only event name and error class, never submission content.

- [ ] **Step 5: Verify and commit the index**

Run:

```bash
node --import tsx --test tests/admin-pages.test.ts tests/admin-submissions.test.ts
npm run check
git diff --check
```

Commit:

```bash
git add src/components/admin/AdminShell.astro src/components/admin/StatusBadge.astro src/components/admin/SubmissionList.astro src/pages/admin/submissions/index.astro src/styles/admin.css tests/admin-pages.test.ts
git commit -m "feat: add submissions admin index"
```

### Task 4: Complete submission detail view

**Files:**
- Create: `src/components/admin/SubmissionDetail.astro`
- Create: `src/pages/admin/submissions/[reference]/index.astro`
- Modify: `src/styles/admin.css`
- Modify: `tests/admin-pages.test.ts`

**Interfaces:**
- Consumes: `normalizePublicReference`, `D1AdminSubmissionRepository.findByReference`, `SUBMISSION_STATUSES`, and the verified admin identity.
- Produces: a read-only full detail page plus a status form posting to `/admin/submissions/<reference>/status/`.

- [ ] **Step 1: Add failing story and guest detail contract tests**

Extend `tests/admin-pages.test.ts` to assert the dynamic page normalizes the route parameter and returns 404 when the repository returns null. Assert story rendering includes identity preference, display identity, email, contact permission, publication permission, submission type, and full content. Assert guest rendering includes every stored guest field and recording acknowledgement. Assert both show delivery state, created/updated metadata, a back link, current status, and a `<select name="status">` containing every lifecycle value.

- [ ] **Step 2: Run the focused test and verify the new assertions fail**

Run: `node --import tsx --test tests/admin-pages.test.ts`

Expected: FAIL because the detail route and component do not exist.

- [ ] **Step 3: Implement safe detail rendering**

Create `SubmissionDetail.astro` with explicit story and guest branches. Render long text in elements styled with `white-space: pre-wrap`; rely on Astro escaping and never use `set:html`. Render HTTP(S) links with `target="_blank" rel="noopener noreferrer nofollow"`. Render permission values as human labels: read on show, paraphrase, or private. Keep contact and publication permission visually prominent without color-only meaning.

- [ ] **Step 4: Implement the dynamic page and status form**

Set `prerender = false`; validate the reference before querying; set `Astro.response.status = 404` for invalid or missing records; and render a generic not-found message without revealing database behavior. The status form posts only `status` and includes explanatory text that status is internal and never shown publicly.

- [ ] **Step 5: Verify and commit the detail view**

Run:

```bash
node --import tsx --test tests/admin-pages.test.ts tests/admin-submissions.test.ts
npm run check
git diff --check
```

Commit:

```bash
git add src/components/admin/SubmissionDetail.astro src/pages/admin/submissions/'[reference]'/index.astro src/styles/admin.css tests/admin-pages.test.ts
git commit -m "feat: add submission admin detail view"
```

### Task 5: Authenticated status mutation

**Files:**
- Create: `src/lib/admin/mutation.ts`
- Create: `src/pages/admin/submissions/[reference]/status.ts`
- Test: `tests/admin-mutation.test.ts`
- Modify: `tests/admin-pages.test.ts`

**Interfaces:**
- Produces: `handleStatusUpdate(request, reference, identity, repository, expectedOrigin, now?): Promise<Response>`.
- Consumes: `AdminIdentity`, `normalizePublicReference`, `parseSubmissionStatus`, and `D1AdminSubmissionRepository.updateStatus`.

- [ ] **Step 1: Write failing mutation behavior tests**

Create `tests/admin-mutation.test.ts` with a fake repository. Assert rejection of non-form content, a body over 4 KiB, missing/mismatched Origin, malformed reference, missing status, unknown status, and missing record. Assert a valid request passes only the normalized reference, parsed status, verified identity email, and injected ISO time to the repository, then returns 303 with `Location: /admin/submissions/<reference>/?updated=1`. Assert storage failure returns a generic 500 and never includes the error message.

- [ ] **Step 2: Run the focused test and verify it fails**

Run: `node --import tsx --test tests/admin-mutation.test.ts`

Expected: FAIL because `src/lib/admin/mutation.ts` does not exist.

- [ ] **Step 3: Implement the pure mutation handler**

Check `Content-Type: application/x-www-form-urlencoded`, `Content-Length` when present, and the actual text body length. Compare `new URL(request.headers.get("Origin")).origin` with the configured origin exactly. Parse with `URLSearchParams`, reject duplicate `status` fields, and call the repository only after all checks pass. Return plain text error responses with correct 400, 403, 404, or 500 codes and private/no-store headers.

- [ ] **Step 4: Wire the protected Astro POST route**

Set `prerender = false` and export only `POST`. Require `Astro.locals.adminIdentity`, `env.SUBMISSIONS_DB`, and a valid origin from `env.PUBLIC_SITE_URL`. Call `handleStatusUpdate`; do not accept identity from form fields or headers other than the JWT-verified middleware result. Add a source contract assertion that the mutation URL remains under `/admin/*`.

- [ ] **Step 5: Verify and commit the mutation**

Run:

```bash
node --import tsx --test tests/admin-mutation.test.ts tests/admin-pages.test.ts tests/admin-access.test.ts
npm run check
git diff --check
```

Commit:

```bash
git add src/lib/admin/mutation.ts src/pages/admin/submissions/'[reference]'/status.ts tests/admin-mutation.test.ts tests/admin-pages.test.ts
git commit -m "feat: add authenticated submission status updates"
```

### Task 6: Deployment documentation and end-to-end verification

**Files:**
- Modify: `docs/deployment.md`
- Modify: `.dev.vars.example`
- Modify: `tests/admin-configuration.test.ts`

**Interfaces:**
- Documents: D1 migration commands, Access application paths, OTP identity-provider setup, exact-email policy rules, JWT audience/team-domain configuration, and live verification steps.

- [ ] **Step 1: Add failing documentation contract tests**

Extend `tests/admin-configuration.test.ts` to assert `docs/deployment.md` includes `/admin`, `/admin/*`, One-Time PIN, exact email allow rules, `CLOUDFLARE_ACCESS_TEAM_DOMAIN`, `CLOUDFLARE_ACCESS_AUD`, the `0002` remote migration command for development and production, and checks for both the index and nested detail path. Assert `.dev.vars.example` documents the Access values without any real administrator email.

- [ ] **Step 2: Run the focused test and verify the documentation assertions fail**

Run: `node --import tsx --test tests/admin-configuration.test.ts`

Expected: FAIL because the deployment guide does not yet describe admin Access setup.

- [ ] **Step 3: Document Cloudflare Zero Trust and deployment steps**

Add dashboard instructions: enable OTP; create self-hosted applications covering each environment's admin root and descendants; create an Allow policy with exact Emails as Include and One-time PIN as Require; copy the Audience tag; configure the team domain; apply D1 migration `0002`; deploy; confirm an unapproved address is denied; confirm an approved address receives OTP; open the index and one nested record; change a status; confirm D1 stores `updated_at` and `status_updated_by`.

State explicitly that an unrestricted OTP Include rule is unsafe because it permits any valid email address. Explain that local admin routes fail closed and deployed development is the authentication integration environment.

- [ ] **Step 4: Run full local verification**

Run:

```bash
npm ci
npm test
npm run validate:content
npm run check
npm run build:dev
npm run build:prod
npx wrangler types
git diff --exit-code -- worker-configuration.d.ts
npx wrangler deploy --env development --dry-run
npx wrangler deploy --env production --dry-run
git diff --check
```

Expected: every command succeeds with zero warnings. If `npm ci` regenerates only known generated location data, preserve the user's existing file and do not include it in admin commits.

- [ ] **Step 5: Review the complete admin security boundary**

Confirm with repository searches that `/admin` is absent from public header, footer, robots-generated URLs, and sitemap entries; there is no password field, user table, administrator allowlist, auth bypass flag, raw JWT logging, `set:html`, or SQL built from raw query parameters. Confirm every admin mutation path is beneath `/admin/*` and every D1 call uses `.bind(...)`.

- [ ] **Step 6: Commit documentation and final verification adjustments**

```bash
git add docs/deployment.md .dev.vars.example tests/admin-configuration.test.ts
git commit -m "docs: add submissions admin deployment guide"
```

Do not deploy or create Cloudflare Access resources in this task. Report the exact manual Access values still needed and distinguish local verification from live OTP verification.
