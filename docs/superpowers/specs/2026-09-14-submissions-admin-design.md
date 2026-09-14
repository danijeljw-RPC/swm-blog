# Submissions Admin Design

## Purpose

Add a private editorial workspace for reviewing Sisters with Mirrors story and guest submissions without querying D1 manually. The workspace is intentionally small: a filterable submissions index, a complete submission detail view, and controlled status changes.

## Existing architecture

The Astro 7 site runs in server mode on Cloudflare Workers. Public story and guest endpoints validate submissions, persist normalized records to the `SUBMISSIONS_DB` D1 binding, and track email delivery separately. Submission records already carry a public reference and begin with status `new`; the intended lifecycle is `new`, `reviewing`, `contacted`, `shortlisted`, `scheduled`, `declined`, `used`, or `archived`.

The admin feature extends this existing subsystem. It does not introduce another application, database, user store, or client-side dashboard framework.

## Routes and presentation

Create these dynamic, non-prerendered routes:

- `GET /admin/submissions/` renders the submissions index.
- `GET /admin/submissions/[reference]/` renders one complete submission.
- `POST /admin/submissions/[reference]/status/` validates and updates its status, then redirects to the detail page.

The index uses the site's existing premium dark-and-gold design system in a practical editorial layout. It shows the public reference, submission category, display identity, received date, current status, permission summary where applicable, and a short plain-text excerpt. The page is responsive: a table-like desktop layout becomes stacked records on narrow screens.

The available filters are All, New, Stories, Questions, Topic Suggestions, Guest Requests, Contacted, Scheduled, Used, and Archived. Category filters use `kind` and `submission_type`; lifecycle filters use `status`. `Something Else` story submissions remain available through All and status filters rather than being mislabelled. Results are ordered newest first and paginated with a fixed bounded page size.

The detail page renders only escaped text. Story details include identity preference, the correct name/pseudonym/anonymous presentation, email when supplied, contact permission, publication permission, submission type, and full content. Guest details include name and preferred name, email, location/timezone, biography, conversation topic, Why Sisters with Mirrors, website, social links, previous appearances, topics, additional notes, and recording acknowledgement. It also shows notification and acknowledgement delivery states when present.

## Authentication boundary

Cloudflare Access is the identity provider and authorization policy engine. A self-hosted Access application protects the production and development `/admin/*` paths. One-Time PIN is the only login method. The Allow policy contains exact administrator email addresses maintained in Cloudflare Zero Trust; email addresses are not hard-coded in this repository.

Access at the edge is necessary but not the application's only check. Astro middleware intercepts every `/admin` and `/admin/*` request and validates the `Cf-Access-Jwt-Assertion` header against Cloudflare's remote JWKS. Validation requires:

- an RS256 signature from the configured Cloudflare Access team domain;
- the exact configured issuer;
- the Access application's configured audience tag;
- normal JWT expiry and not-before validation; and
- a non-empty authenticated email claim.

The middleware fails closed with a generic 403 response when configuration, assertion, signature, issuer, audience, time claims, or email identity are invalid. It makes the verified identity available only to server-side admin handlers. The application does not reproduce the Access email allowlist or make authorization decisions from an unverified header.

Use the maintained `jose` package and `createRemoteJWKSet` rather than implementing JWT cryptography. Required environment variables are `CLOUDFLARE_ACCESS_TEAM_DOMAIN` (for example, `https://team-name.cloudflareaccess.com`) and `CLOUDFLARE_ACCESS_AUD`. Neither value grants access by itself, but each environment receives its own explicit configuration. No application password, login route, user table, reset workflow, or session mechanism is added.

Local requests do not receive an Access assertion and therefore cannot enter `/admin/*`. Unit and rendering tests inject verified claims at the middleware boundary; deployed development behind Access is the integration environment. There is no local authentication bypass in production code.

## Data access and status updates

Extend the submission repository with admin-specific read methods rather than embedding SQL in pages. The index query accepts only a closed filter value and bounded positive page number. It uses parameterized SQL, a deterministic `created_at DESC, id DESC` ordering, and a matching count query for pagination. Detail lookup uses the case-normalized public reference, not a raw SQL fragment.

Status updates accept only the established status enum. The update statement records `status`, `updated_at`, and the verified administrator email in `status_updated_by`. A migration adds the latter two nullable columns for existing records. It also adds indexes supporting the index and filter queries. No submitted content is rewritten by an admin status change.

The mutation uses POST/redirect/GET. It validates the request `Origin` against the current configured site origin, validates form encoding and body size, verifies the public reference and status, performs a parameterized update, and redirects with a simple success marker. Missing submissions return 404; invalid input returns 400; an origin mismatch returns 403; unexpected storage errors return a generic 500 without leaking SQL details.

## Response security

Every admin response includes `Cache-Control: private, no-store` and `X-Robots-Tag: noindex, nofollow`. Admin pages are omitted from the sitemap and public navigation. State-changing responses also use `Referrer-Policy: same-origin`. User-supplied URLs are displayed as untrusted text or links with safe external-link attributes and are never fetched server-side.

Cloudflare Access should be configured for both `/admin` and `/admin/*` behavior through an application path that covers the root and descendants. The deployment guide will call out checking both the exact index URL and a nested detail URL before considering protection complete.

## Cloudflare configuration

For each deployed hostname, create a Cloudflare Zero Trust self-hosted application covering the admin path. Enable One-Time PIN as the login method. Create an Allow policy whose Include rule lists each approved administrator email address exactly and whose Require rule is Login Methods: One-time PIN. Do not use `Include Everyone` or an unrestricted `Include Login Methods: One-time PIN` rule, because either would allow any email user.

Copy the application's Audience tag into `CLOUDFLARE_ACCESS_AUD` and configure the account team domain as `CLOUDFLARE_ACCESS_TEAM_DOMAIN`. These are application configuration values, not administrator identity lists. Administrator membership remains exclusively in the Access policy.

Documentation will include dashboard steps and verification checks. Creating the Access application and policy is a Cloudflare account operation and remains a manual deployment step unless account automation credentials are already available and explicitly authorized.

## Testing and verification

Use the existing Node test runner and red-green-refactor workflow. Tests cover valid and invalid Access assertions, issuer and audience mismatch, missing email claims, missing configuration, protection of the root and nested admin paths, filter parsing, pagination bounds, category/status query behavior, detail normalization, every valid status, invalid status rejection, origin rejection, missing records, parameterized updates, and propagation of the verified administrator identity.

Page contract tests cover all requested filters, complete story and guest fields, permission visibility, status controls, responsive semantics, no public navigation links, and no sitemap exposure. Migration/configuration tests cover the new columns and required Access environment variables.

Final verification runs the complete test suite, content validation, Astro type checking, development and production builds, Wrangler type generation/diff inspection, Wrangler dry-run packaging for both environments, and `git diff --check`. Zero warnings are accepted. Live OTP login and Access policy enforcement require the deployed development and production hostnames and are documented as deployment checks rather than represented as locally verified.
