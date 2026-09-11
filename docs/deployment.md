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
