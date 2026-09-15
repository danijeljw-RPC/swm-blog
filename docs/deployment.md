# Cloudflare deployment

Sisters with Mirrors uses two independent Workers Builds projects:

```text
dev  -> scripts/ci-build-dev.sh  -> scripts/ci-deploy-dev.sh  -> swm-blog-dev
main -> scripts/ci-build-prod.sh -> scripts/ci-deploy-prod.sh -> swm-blog-prod
```

GitHub Actions validates code only. Cloudflare Workers Builds performs deployment. The build selects `CLOUDFLARE_ENV`; Astro writes a flattened configuration to `dist/server/wrangler.json`. The deploy script validates that generated Worker name, D1 ID, and SESSION KV ID before running Wrangler against that file. It never adds a second `--env` selector.

Workers Builds installs dependencies before invoking the configured build command and exposes `WORKERS_CI=1`. The environment build scripts rely on that platform install when this flag is present, while retaining `npm ci` for local or manual execution.

## Environment resources

| Resource | DEV | PROD |
|---|---|---|
| Worker | `swm-blog-dev` | `swm-blog-prod` |
| Host | `dev.sisterswithmirrors.com` | `sisterswithmirrors.com` |
| D1 | `sisters-with-mirrors-submissions-dev` | `sisters-with-mirrors-submissions-prod` |
| Session KV | `sisters-with-mirrors-session-dev` | `sisters-with-mirrors-session-prod` |
| Turnstile widget | `Sisters with Mirrors DEV` | `Sisters with Mirrors PROD` |
| Allowed submission hostname | `dev.sisterswithmirrors.com` | `sisterswithmirrors.com` |

Each Worker has its own `TURNSTILE_SECRET_KEY` and `SUBMISSION_RATE_LIMIT_SECRET`. Secret values are held only by Cloudflare. `TURNSTILE_TEST_MODE` is never declared in either deployed environment.

The public media URL is intentionally shared: it points to published public episode media and is not a Worker state binding. The Send Email service capability is also shared, while each Worker keeps explicit sender and notification configuration. The application constructs recipients and messages only after input validation, Turnstile verification, rate limiting, and persistence, so it is not a general relay.

## Cloudflare Workers Builds settings

Configure these fields after connecting the repository to each Worker.

### `swm-blog-dev`

- Production branch: `dev`
- Build command: `scripts/ci-build-dev.sh`
- Deploy command: `scripts/ci-deploy-dev.sh`
- Root directory: `/`

### `swm-blog-prod`

- Production branch: `main`
- Build command: `scripts/ci-build-prod.sh`
- Deploy command: `scripts/ci-deploy-prod.sh`
- Root directory: `/`

The authenticated Wrangler OAuth token does not have Workers Builds API permission, so these repository-connection fields must be entered in the dashboard. The scripts still fail closed if a dashboard branch is misconfigured.

## Canonical D1 migration history

Keep one checked-in `migrations/` directory and apply it independently:

```bash
npx wrangler d1 migrations apply sisters-with-mirrors-submissions-dev --remote --env dev
npx wrangler d1 migrations apply sisters-with-mirrors-submissions-prod --remote --env prod
```

Never create environment-specific copies of the SQL files.
Migration `0002_add_submission_admin_fields.sql` adds the admin audit columns and indexes without replacing the shared migration history.

## Cloudflare Access for submissions admin

Astro middleware protects `/admin`, `/admin/*`, and therefore every admin page and status-mutation endpoint. It verifies the Cloudflare Access JWT signature, issuer, audience, expiry/not-before claims, subject, and email. Missing configuration or identity returns 403. Admin responses are private, non-cacheable, and excluded from indexing.

Cloudflare's API currently reports that Access is not enabled for this account. Complete this one-time dashboard operation before attaching the public hostnames:

1. Open Cloudflare Zero Trust and click **Enable Access**. Choose the account team name; this creates the `https://<team-name>.cloudflareaccess.com` team domain.
2. Enable **One-Time PIN** as an identity provider.
3. Create a DEV self-hosted application covering `dev.sisterswithmirrors.com/admin*` so it matches both `/admin` and descendants.
4. Create a PROD self-hosted application covering `sisterswithmirrors.com/admin*`.
5. For each application, add an **Allow** policy using exact email rules for:
   - `danijel@repasscloud.com`
   - `warren.lio@avanoa.co`
6. Require login method **One-Time PIN**. Do not use `Everyone` or an unrestricted OTP include rule.
7. Add each real audience tag to its matching `env.dev.vars.CLOUDFLARE_ACCESS_AUD` or `env.prod.vars.CLOUDFLARE_ACCESS_AUD` in `wrangler.jsonc`.
8. Add the real team domain to both environments as `CLOUDFLARE_ACCESS_TEAM_DOMAIN`, rebuild, and deploy DEV before PROD.

Until those real values are configured, deployed Access variables are deliberately absent and middleware denies all admin requests. There is no local or deployed authentication bypass.

## Custom-domain cutover

The zone `sisterswithmirrors.com` is active. The apex currently points to the legacy `swm-blog` Worker; `dev.sisterswithmirrors.com` is not attached. After Access is enabled and both audience tags are committed:

1. Deploy DEV. Wrangler attaches `dev.sisterswithmirrors.com` to `swm-blog-dev`.
2. Verify public pages, anonymous admin denial, approved OTP login, DEV submission creation, and a DEV admin status update.
3. Deploy PROD. Wrangler moves `sisterswithmirrors.com` from legacy `swm-blog` to `swm-blog-prod`.
4. Repeat the public, Access, submission, and admin checks against PROD.

Do not CNAME either hostname to a `workers.dev` preview URL.

## Local development

Local development uses `.dev.vars`, local D1/Miniflare state, localhost, and Cloudflare's documented test Turnstile credentials. Wrangler does not contact remote D1 unless `--remote` is explicitly supplied.

```bash
cp .dev.vars.example .dev.vars
npx wrangler d1 migrations apply SUBMISSIONS_DB --local
npm run dev
```

Local admin routes fail closed because they have no real Access assertion. This is deliberate.

## Post-deployment checks

- Signed-out and unapproved users cannot access `/admin/submissions/` or nested routes.
- A protected nested detail route such as `/admin/submissions/SWM-S-234567/` is denied anonymously.
- Both approved addresses can complete OTP login.
- DEV admin reads and changes DEV D1 only.
- PROD admin reads and changes PROD D1 only.
- A DEV session is absent from PROD and vice versa.
- Story and guest forms accept fresh Turnstile tokens and reject replayed tokens.
- A production deployment contains no DEV D1 or KV identifier, and a DEV deployment contains no PROD identifier.
