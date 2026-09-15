# Get Involved Design

## Purpose

Add a production-ready Get Involved section with two deliberately separate workflows: Share Your Story for editorial submissions that do not imply appearing on the show, and Be a Guest for people who want to join a recorded conversation.

## Existing architecture

The site uses Astro 7 in server output mode with `@astrojs/cloudflare` and Wrangler 4.130.0. It has a shared `BaseLayout`, header/footer navigation, global design tokens, Node test-runner tests, and environment-specific Wrangler configuration. It does not currently have form persistence, outbound email, Turnstile, or application-level rate limiting.

## Pages and presentation

Create `/get-involved/`, `/get-involved/share-your-story/`, and `/get-involved/be-a-guest/`. The landing page presents two equal, clearly differentiated cards. The form pages use shared, focused Astro components for field presentation, status messages, Turnstile, and successful submission references. Copy remains conversational, curious, and direct.

Add Get Involved to primary navigation and add its two child links in the footer. The desktop header may expose the child links as a nested disclosure if this can be done without disrupting the existing responsive menu; otherwise the landing page and footer provide child discovery.

## Client interaction and accessibility

Each form uses semantic HTML labels, fieldsets, legends, descriptions, and an error summary. A small progressive-enhancement script submits JSON to its corresponding API route, disables the submit button while active, announces errors through an `aria-live` region, focuses the error summary after failure, resets Turnstile after recoverable failures, and replaces the form with a success panel containing the public reference after success. Native form controls and server endpoints remain the source of truth.

The story form adapts identity and main-content labels in the browser without making hidden identity fields required. Anonymous submissions require no name, pseudonym, or email. Publication permission is always explicit and never inferred.

## Domain model and validation

Use separate `StorySubmissionInput` and `GuestSubmissionInput` types plus a normalized `Submission` persistence model. Shared pure validation functions trim values, convert empty optional values to `null`, reject unknown enum values, validate email and HTTP(S) URLs, normalize multi-line social links, enforce field-specific length limits, and reject malformed booleans. No raw payload is persisted.

Story rules include: submission type required; matching identity value required only for named or pseudonymous submissions; content required up to 20,000 characters; publication permission required; email optional; contact permission allowed only when email is present.

Guest rules include: name and email required; email valid; recording acknowledgement must be true; biography, discussion topic, and Why Sisters with Mirrors required with sensible long-form limits; location/timezone optional; website and each social URL optional but valid HTTP(S); previous appearances and additional notes optional; topic tags are a closed list and supplement rather than replace free text.

## API flow and abuse controls

Create `POST /api/submissions/story/` and `POST /api/submissions/guest/`. Both routes share an orchestration service and enforce JSON content type plus a 32 KiB request size before parsing. Responses use a stable JSON envelope and return 201, 400, 403, 413, 429, or 500 without stack traces.

Each request passes through these gates in order: request size/content type, JSON parsing, honeypot, input validation, rate limit, Turnstile verification, reference creation, D1 persistence, then notification delivery. The honeypot is visually hidden from people and accessibility APIs. Turnstile validation happens server-side and validates success, action, and allowed hostname. Development uses Cloudflare's documented test keys, not a validation bypass.

Rate limiting is stored in D1 using a one-way SHA-256 digest of the Cloudflare client address plus a server secret. No raw IP address is stored. A transaction-safe fixed window permits five accepted attempts per digest per hour. Honeypot hits and rejected attempts receive generic responses and are never persisted as submissions.

## Persistence

Add a D1 database binding named `SUBMISSIONS_DB` and a migration-managed schema. The `submissions` table stores a UUID primary key, collision-resistant public reference with a unique constraint, kind, timestamps, internal status, normalized workflow fields, JSON arrays for topics/social links, and minimal request metadata such as validated hostname and user-agent truncation. It does not store raw IP addresses, Turnstile tokens, honeypot values, or unvalidated payloads.

An `email_deliveries` table stores one row per intended notification or acknowledgement, including delivery state, attempts, timestamps, and a non-sensitive last error category. This preserves retry visibility without storing email bodies twice. A `submission_rate_limits` table supports bounded fixed-window counters and can be pruned later.

Submission status begins as `new`; the schema constrains it to `new`, `reviewing`, `contacted`, `shortlisted`, `scheduled`, `declined`, `used`, or `archived`.

## References

Generate an internal UUID with `crypto.randomUUID()`. Generate an independent public reference with cryptographic random bytes in the form `SWM-S-XXXXXX` or `SWM-G-XXXXXX`, excluding ambiguous characters. The D1 unique constraint is authoritative; retry on the unlikely public-reference collision without weakening UUID uniqueness.

## Notifications

Define a `SubmissionNotifier` interface and implement it with the native Cloudflare `send_email` binding. Internal notifications go only to a configured allowed destination and contain safely escaped plain text and HTML. Acknowledgements are sent only to the validated submitter email and never accept arbitrary sender or subject values from the request.

Persistence is authoritative: notification rows are created with the submission. The request then attempts internal notification and optional acknowledgement. Delivery success/failure is recorded. Email failure does not roll back or conceal the accepted submission; the success response may state that the submission was received without promising email delivery.

Local development uses a notifier that logs only the submission reference and notification kind, never story content or contact details. Production fails closed if the D1 binding, Turnstile secret, or required notification address is absent. Missing email delivery configuration records pending/failed delivery while retaining the submission.

## Configuration

Update the existing `wrangler.jsonc`; do not add a second configuration system. Declare `SUBMISSIONS_DB` for the base, development, and production environments with explicit placeholder database IDs that must be replaced before deployment. Declare the native send-email binding and non-secret public configuration. Keep `TURNSTILE_SECRET_KEY` and `SUBMISSION_RATE_LIMIT_SECRET` as Wrangler secrets. Expose the site key to rendered server pages through `TURNSTILE_SITE_KEY`; use Cloudflare's test site key only in local example configuration.

Add `.dev.vars.example` containing documented non-secret/test values and placeholders only. Update deployment documentation with database creation/migration, environment binding IDs, Email Routing prerequisites, and secret commands. Regenerate `worker-configuration.d.ts` using the installed Wrangler version.

## Security and privacy

All database writes are parameterized. User text is rendered only as text or escaped email content. URLs remain untrusted links and are not fetched. Secrets and bindings stay server-side. Turnstile tokens are single-use and never logged. Public responses never expose internal status or delivery details.

Each form carries concise privacy copy: submissions go to Sisters with Mirrors for review, contact information is used for correspondence where applicable, and stories are discussed only according to the selected permission. Anonymous describes editorial anonymity; technical infrastructure logs may still exist.

## Testing and verification

Use the existing Node test runner. Pure unit tests cover every required validation case, normalization, reference format, HTML escaping, and notification wording branches. Repository tests cover parameterized D1 statements and persistence-before-notification behavior with focused fakes. Contract tests cover routes, navigation, semantic form requirements, separate workflows, success/error affordances, and configuration/migration structure.

Follow red-green-refactor for behavior. Final verification is `npm ci`, `npm test`, `npm run validate:content`, `npm run check`, `npm run build:dev`, `npm run build:prod`, regenerated Wrangler types with no diff, and Wrangler dry-run packaging for both environments. Any warning is a failure. Live Turnstile, D1, Email Routing, and actual delivery remain deployment checks requiring the user's Cloudflare resources and secrets.
