# Cloudflare DEV and PROD Isolation Design

## Objective

Deploy the `dev` and `main` branches as two independently named Cloudflare Workers whose mutable data, sessions, secrets, bot-verification configuration, admin Access applications, host validation, and deployment commands cannot cross environment boundaries.

## Architecture

The repository retains one root Wrangler source configuration with local-only top-level defaults and two explicit non-inheritable environments named `dev` and `prod`. Astro receives `CLOUDFLARE_ENV` during each build and flattens the selected environment into `dist/server/wrangler.json`; deployment uploads that generated file without attempting to retarget it afterward.

`swm-blog-dev` binds only the DEV D1 database and DEV session KV namespace and routes only `dev.sisterswithmirrors.com`. `swm-blog-prod` binds only the PROD D1 database and PROD session KV namespace and routes only `sisterswithmirrors.com`. Each has its own Turnstile widget, Turnstile secret, submission-rate secret, Access application audience, and host/origin values.

The checked-in SQL migration directory remains canonical and is applied independently to both physical D1 databases. The public media URL and Send Email service capability may remain shared because the former is read-only public content and the latter does not store application session or submission state; recipient, sender, and hostname controls remain explicit per environment.

## Build and deployment boundary

Four executable scripts provide branch-specific entry points. Both build and deploy scripts exit successfully without operating when `WORKERS_CI_BRANCH` is supplied with the wrong branch. Build scripts install from the lockfile, run the repository checks required by the current shared script, and build exactly one named Wrangler environment. Deploy scripts inspect the flattened generated config, refuse a mismatched Worker name or binding ID, and upload only that generated configuration.

## Admin security

The completed `codex/submissions-admin` implementation is integrated before deployment. Cloudflare Access protects `/admin` and `/admin/*`; Astro middleware independently verifies the Access JWT issuer, audience, signature, time claims, subject, and email before any admin page or mutation handler executes. Admin data access always uses the environment-local `SUBMISSIONS_DB` binding, and admin responses remain private and non-indexable.

Access applications and policies are created only when the account API exposes sufficient permissions and approved administrator email identities are known. Missing identity or account permission fails closed: Workers may be deployed, but admin traffic remains rejected by application middleware until the environment-specific Access values and policy exist.

## Turnstile and secrets

DEV and PROD use separate widgets restricted to their respective hostnames and separate Worker secrets. `TURNSTILE_TEST_MODE` exists only in ignored local development variables; it is absent from both deployed environment variable sets. Secret values are generated or retrieved only through protected standard-input flows and never written to source, logs, diffs, or reports.

## Validation and rollout

Tests first establish the branch guards, binding isolation, generated Worker identity, production hostname restrictions, and anonymous admin denial. Both builds are then run independently, with `dist/server/wrangler.json` inspected after each. Wrangler dry runs precede remote migration application and deployment. DEV is deployed and checked before PROD; PROD is deployed only after its complete configuration is valid and cannot displace an unrelated production service.

Remote verification covers D1 migration state, KV identifiers, Worker secret names, deployment names, routes, and anonymous denial on admin URLs. OTP login cannot be called complete without approved administrator addresses and a real interactive login.
