# Get Involved Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build two complete, separate Get Involved submission workflows with accessible UI, server validation, abuse protection, durable D1 storage, and Cloudflare-native notifications.

**Architecture:** Astro server pages submit JSON to separate API routes backed by shared pure validation and a submission orchestration service. D1 persistence is authoritative; Turnstile and a privacy-preserving D1 rate limiter gate writes, while Cloudflare Email Routing notifications run after persistence and record delivery outcomes.

**Tech Stack:** Astro 7.3.2, TypeScript 6, Cloudflare Workers, Wrangler 4.130.0, D1, Turnstile, Email Workers, Node test runner.

**Spec:** `docs/superpowers/specs/2026-09-14-get-involved-design.md`

## Global Constraints

- Keep Share Your Story and Be a Guest as separate pages, forms, payloads, and API routes.
- Anonymous story submissions require no name, pseudonym, or email.
- Persist every accepted submission before attempting notification.
- Use only parameterized D1 statements and cryptographically secure identifiers.
- Keep secrets server-side and never log submission content, addresses, or Turnstile tokens.
- Treat warnings as verification failures.
- Preserve unrelated worktree changes.

---

### Task 1: Submission domain and validation

**Files:**
- Create: `src/lib/submissions/types.ts`
- Create: `src/lib/submissions/validation.ts`
- Create: `tests/submission-validation.test.ts`

**Interfaces:**
- Produces: `validateStorySubmission(value: unknown): ValidationResult<StorySubmissionInput>`
- Produces: `validateGuestSubmission(value: unknown): ValidationResult<GuestSubmissionInput>`

- [ ] Write failing table-driven tests for anonymous acceptance, named/pseudonym requirements, permission enums, guest email and acknowledgement, malformed booleans, invalid URLs/emails, topic enums, trimming/null normalization, and size limits.
- [ ] Run `npm test -- tests/submission-validation.test.ts` and confirm failures are caused by missing production modules.
- [ ] Implement focused types, constants, normalization helpers, and discriminated validation results without adding a validation dependency.
- [ ] Run the focused test and full `npm test`; refactor only while green.

### Task 2: Secure IDs and notification rendering

**Files:**
- Create: `src/lib/submissions/references.ts`
- Create: `src/lib/submissions/notifications.ts`
- Create: `tests/submission-references.test.ts`
- Create: `tests/submission-notifications.test.ts`

**Interfaces:**
- Produces: `createSubmissionIdentity(kind: SubmissionKind): { id: string; publicReference: string }`
- Produces: `SubmissionNotifier.notifyNewSubmission(submission)` and `acknowledgeSubmission(submission)`
- Produces: pure internal/acknowledgement message renderers.

- [ ] Write and run failing tests for UUID/public-reference format, kind prefix, ambiguous-character exclusion, HTML escaping, permission-sensitive story acknowledgements, guest wording, and no promise of publication/contact.
- [ ] Implement secure reference generation with `crypto.randomUUID()` and `crypto.getRandomValues()`.
- [ ] Implement plain-text and escaped-HTML message renderers plus notifier interface and Cloudflare/local implementations.
- [ ] Run focused and full tests; keep notifier destinations configuration-owned.

### Task 3: D1 schema and repository

**Files:**
- Create: `migrations/0001_create_submissions.sql`
- Create: `src/lib/submissions/repository.ts`
- Create: `tests/submission-repository.test.ts`

**Interfaces:**
- Consumes: normalized `Submission` and delivery types from Task 1.
- Produces: `D1SubmissionRepository.create(submission, deliveries)`, `markDelivery(...)`, and `consumeRateLimit(...)`.

- [ ] Write failing repository tests using a statement-recording D1 fake to verify parameter binding, JSON serialization, transaction batch ordering, collision reporting, delivery updates, and fixed-window decisions.
- [ ] Add the migration with status/kind/permission constraints, indexes, unique public references, delivery rows, and rate-limit rows.
- [ ] Implement the repository using `prepare().bind()`, `batch()`, and bounded error categorization.
- [ ] Run focused and full tests.

### Task 4: Turnstile and submission orchestration

**Files:**
- Create: `src/lib/submissions/turnstile.ts`
- Create: `src/lib/submissions/service.ts`
- Create: `tests/submission-turnstile.test.ts`
- Create: `tests/submission-service.test.ts`

**Interfaces:**
- Produces: `verifyTurnstile(input, config, fetcher): Promise<TurnstileResult>` validating success/action/hostname.
- Produces: `submitStory(...)` and `submitGuest(...)` returning accepted, validation, spam, rate-limit, or infrastructure outcomes.

- [ ] Write failing tests for Turnstile rejection/success, hostname/action mismatch, honeypot rejection, hashed client key, rate limit, collision retry, persistence-before-email, and accepted submission despite notifier failure.
- [ ] Implement canonical Siteverify POST without logging tokens and SHA-256 client digests salted by the server secret.
- [ ] Implement orchestration in the exact gate order from the design.
- [ ] Run focused and full tests.

### Task 5: Astro API endpoints

**Files:**
- Create: `src/pages/api/submissions/story.ts`
- Create: `src/pages/api/submissions/guest.ts`
- Create: `src/lib/submissions/http.ts`
- Create: `tests/submission-api.test.ts`

**Interfaces:**
- Consumes: Task 4 service functions and `Astro.locals.runtime.env` bindings.
- Produces: stable JSON responses with 201/400/403/413/415/429/500 status codes.

- [ ] Write failing tests against exported route handlers for content type, declared/actual request size, malformed JSON, mapped service outcomes, security headers, and non-leaking 500 responses.
- [ ] Implement request parsing capped at 32 KiB and runtime dependency construction.
- [ ] Implement separate POST-only API routes with `prerender = false`.
- [ ] Run focused and full tests.

### Task 6: Shared accessible form UI

**Files:**
- Create: `src/components/get-involved/FormField.astro`
- Create: `src/components/get-involved/FormMessage.astro`
- Create: `src/components/get-involved/SubmissionSuccess.astro`
- Create: `src/components/get-involved/Turnstile.astro`
- Create: `src/components/get-involved/SubmissionFormShell.astro`
- Create: `src/styles/get-involved.css`
- Create: `tests/get-involved-components.test.ts`

**Interfaces:**
- Produces: reusable semantic form primitives and progressive-enhancement behavior configured by form/action/kind.

- [ ] Write failing source/render contract tests for labels, described-by connections, live/error regions, focus target, disabled/submitting state, Turnstile reset, success reference, honeypot exclusion, and reduced-motion/mobile CSS.
- [ ] Implement components and shared styles using existing design tokens.
- [ ] Implement the browser controller with safe text rendering and field-level/server error mapping.
- [ ] Run focused and full tests.

### Task 7: Landing and story workflow

**Files:**
- Create: `src/components/get-involved/GetInvolvedCard.astro`
- Create: `src/pages/get-involved/index.astro`
- Create: `src/pages/get-involved/share-your-story.astro`
- Create: `tests/get-involved-story-page.test.ts`

**Interfaces:**
- Consumes: Task 6 form components; submits the Task 1 story shape to `/api/submissions/story/`.

- [ ] Write failing page contract tests for route copy, separate intent, identity controls, adaptive labels, explicit publication permission, optional contact/email behavior, privacy copy, cross-link, and Turnstile action.
- [ ] Implement the two-card landing page and complete story form.
- [ ] Add identity/submission-type enhancement without changing server requirements.
- [ ] Run focused and full tests.

### Task 8: Guest workflow

**Files:**
- Create: `src/pages/get-involved/be-a-guest.astro`
- Create: `tests/get-involved-guest-page.test.ts`

**Interfaces:**
- Consumes: Task 6 form components; submits the Task 1 guest shape to `/api/submissions/guest/`.

- [ ] Write failing page contract tests for every required/optional field, non-gatekeeping topic list, free text, recording acknowledgement clarification, privacy copy, cross-link, and Turnstile action.
- [ ] Implement the complete guest form with multi-line validated social URLs.
- [ ] Run focused and full tests.

### Task 9: Navigation, sitemap, configuration, and deployment docs

**Files:**
- Modify: `src/components/layout/Header.astro`
- Modify: `src/components/layout/Footer.astro`
- Modify: `src/utils/sitemap.ts`
- Modify: `tests/navigation-links.test.ts`
- Modify: `tests/feed-and-sitemap-contract.test.ts`
- Modify: `wrangler.jsonc`
- Regenerate: `worker-configuration.d.ts`
- Create: `.dev.vars.example`
- Modify: `.gitignore`
- Modify: `docs/deployment.md`
- Create: `tests/submission-configuration.test.ts`

**Interfaces:**
- Provides runtime bindings `SUBMISSIONS_DB`, `SUBMISSIONS_EMAIL`, `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `SUBMISSION_RATE_LIMIT_SECRET`, `SUBMISSIONS_NOTIFICATION_EMAIL`, and `SUBMISSIONS_FROM_EMAIL`.

- [ ] Write failing tests for navigation discovery, sitemap routes, D1/send-email bindings across environments, migration declarations, example-secret safety, and documentation commands.
- [ ] Update navigation and sitemap using their existing structures.
- [ ] Update the existing Wrangler config with explicit binding placeholders per environment; add the ignored local example file and deployment steps.
- [ ] Run `./node_modules/.bin/wrangler types` and inspect the generated binding types.
- [ ] Run focused and full tests.

### Task 10: End-to-end local verification

**Files:**
- Modify only files proven necessary by failures from the checks below.

**Interfaces:**
- Verifies all previous tasks as one deployable feature.

- [ ] Run `npm ci` and fail on warnings or errors.
- [ ] Run `npm test` and confirm zero failures/warnings.
- [ ] Run `npm run validate:content` and confirm zero failures/warnings.
- [ ] Run `npm run check` and confirm zero errors/warnings.
- [ ] Run `npm run build:dev` and `npm run build:prod`; confirm both are warning-free.
- [ ] Run Wrangler dry-run packaging for the generated development and production builds using the installed CLI and existing deploy convention.
- [ ] Apply the migration to a fresh local D1 database, start the local Worker with documented test configuration, and submit one anonymous story plus one guest request through the actual endpoints.
- [ ] Re-run the full suite after any verification-driven fixes and inspect `git diff --check` plus `git status --short`.
