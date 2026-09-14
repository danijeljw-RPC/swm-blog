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
