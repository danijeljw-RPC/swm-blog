# Cloudflare deployment

The intended flow is:

```text
dev  -> development Worker -> https://dev.sisterswithmirrors.com
main -> production Worker  -> https://sisterswithmirrors.com
```

`.github/workflows/deploy.yml` tests, validates, builds the selected environment, and deploys it with Wrangler. A pull request from `dev` to `main` is the normal production release path.

## Current placeholders

| Value | Configuration |
|---|---|
| Production domain | `sisterswithmirrors.com` (route not yet configured) |
| Development domain | `dev.sisterswithmirrors.com` (route not yet configured) |
| R2 bucket | `sisters-with-mirrors` (binding intentionally not attached yet) |
| Media hostname | `media.sisterswithmirrors.com` (DNS/custom domain not yet configured) |
| Production Worker | `sisters-with-mirrors-prod-tba` |
| Development Worker | `sisters-with-mirrors-dev-tba` |

Replace the two `*-tba` names before the first deploy. Routes are absent until Worker names and Cloudflare zone routing are confirmed. The bucket name is recorded, but no R2 binding is declared while the bucket and public custom domain are still being created.

## GitHub secrets

The workflow references these names only:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

Do not put their values in `.dev.vars.example`, `wrangler.jsonc`, or source files.

## Local Worker checks

```bash
npm ci
npm run dev
npm run build:dev
npx wrangler dev
```

`npm run preview` also exercises the adapter's local Worker-compatible preview after a build. The environment is selected during the build (`CLOUDFLARE_ENV`); Wrangler then deploys the generated environment configuration without a second `--env` override. These commands do not contact Cloudflare or write to R2.

## Before first deployment

- [ ] Replace both `*-tba` Worker names.
- [ ] Create or confirm the `sisters-with-mirrors` R2 bucket.
- [ ] Create the `media.sisterswithmirrors.com` R2 custom domain.
- [ ] Add the production and development Worker routes.
- [ ] Add the two GitHub secrets.
- [ ] Push to `dev`, inspect it, then open the `dev` → `main` pull request.

## Get Involved submissions

Create separate D1 databases for development and production, replace the placeholder IDs in `wrangler.jsonc`, and apply the checked-in migration:

```bash
npx wrangler d1 create sisters-with-mirrors-submissions-dev
npx wrangler d1 create sisters-with-mirrors-submissions-prod
npx wrangler d1 migrations apply sisters-with-mirrors-submissions-dev --remote
npx wrangler d1 migrations apply sisters-with-mirrors-submissions-prod --remote
```

Create a managed Turnstile widget for `sisterswithmirrors.com` and `dev.sisterswithmirrors.com`. Replace the production site-key placeholder, then store `TURNSTILE_SECRET_KEY` and a different long random `SUBMISSION_RATE_LIMIT_SECRET` in each deployed Worker environment. Never use the documented test keys outside local development.

Enable Cloudflare Email Service/Email Routing for `sisterswithmirrors.com`, onboard `hello@sisterswithmirrors.com` as an allowed sender, and verify the team destination. Change the three non-secret email settings together if another sender or team address is used. The binding intentionally has no recipient allowlist because acknowledgements go to validated submitter addresses; the API cannot be used as an open relay because recipients, subjects, and bodies are created only after validation, Turnstile, rate limiting, and persistence.

For local development, copy `.dev.vars.example` to `.dev.vars`, keep that file untracked, initialise local D1, and run Wrangler. `TURNSTILE_TEST_MODE=true` accepts Cloudflare's test response action only after Siteverify succeeds; never configure it on a deployed Worker.

```bash
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply sisters-with-mirrors-submissions-local --local
npm run build:dev
npx wrangler dev
```

## Submissions admin workspace (Cloudflare Access)

The private editorial workspace at `/admin` and `/admin/*` (including `/admin/submissions/` and `/admin/submissions/<reference>/`) reviews story and guest submissions. It is protected at the edge by Cloudflare Zero Trust Access and independently verified by Astro middleware. There is no application password, login route, user table, or authentication bypass anywhere in this repository.

### Apply the `0002` migration

Apply the admin data-layer migration to each remote database before enabling Access, in addition to the existing `0001` migration:

```bash
npx wrangler d1 migrations apply sisters-with-mirrors-submissions-dev --remote
npx wrangler d1 migrations apply sisters-with-mirrors-submissions-prod --remote
```

The `0002` migration adds nullable `updated_at` and `status_updated_by` columns plus supporting indexes; it does not rebuild or delete existing submission data.

### Create the Cloudflare Zero Trust Access application (per environment)

For each deployed hostname (development and production):

1. In Cloudflare Zero Trust, enable **One-Time PIN** as a login method for the team, if not already enabled.
2. Create a **self-hosted application** whose path covers the admin root and descendants (`https://<hostname>/admin` and `https://<hostname>/admin/*`) so both the index and any nested detail path (for example `/admin/submissions/` and `/admin/submissions/SWM-S-XXXXXX/`) are protected.
3. Add an **Allow** policy with:
   - **Include**: exact email addresses for each approved administrator (do not use `Include Everyone`).
   - **Require**: Login Methods — **One-time PIN**.

   An unrestricted `Include Everyone` or an unrestricted `Include Login Methods: One-time PIN` rule is unsafe — either would let any email address in, because OTP only proves someone controls an inbox, not that they are an administrator. Exact email allow-listing in the Access policy is the only place administrator identity is maintained; it is never stored or hard-coded in this repository.
4. Copy the application's **Audience** tag into `CLOUDFLARE_ACCESS_AUD` for that environment, and set `CLOUDFLARE_ACCESS_TEAM_DOMAIN` to the account's team domain (for example `https://your-team-name.cloudflareaccess.com`).

Both values live in `wrangler.jsonc` per environment (base/local, `development`, `production`) as `vars.CLOUDFLARE_ACCESS_TEAM_DOMAIN` and `vars.CLOUDFLARE_ACCESS_AUD`, and are documented (without any real administrator email) in `.dev.vars.example`. After changing `wrangler.jsonc`, regenerate bindings:

```bash
npx wrangler types
```

### Local behavior vs. deployed verification

Local requests never carry a `Cf-Access-Jwt-Assertion` header, so local admin routes fail closed with a generic 403 — there is no local authentication bypass in production code. Deployed development, once the Access application and policy above are configured, is the integration environment for OTP verification. Live login and Access policy enforcement can only be checked against a deployed hostname, not locally.

### Verification checklist after deploying

- [ ] Visiting `/admin/submissions/` while signed out (or with an unapproved email) is denied by Cloudflare Access.
- [ ] An approved administrator email receives a One-Time PIN and reaches `/admin/submissions/` after entering it.
- [ ] The index page at `/admin/submissions/` loads and lists submissions.
- [ ] Opening one nested record at `/admin/submissions/<reference>/` loads its full detail.
- [ ] Changing a status on the detail page redirects back with `?updated=1`.
- [ ] The D1 row for that submission now has `updated_at` and `status_updated_by` set.
