import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("deployed Cloudflare environments never contain placeholder Access settings", async () => {
  const config = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  const environments = [config.env.dev, config.env.prod];

  for (const environment of environments) {
    const teamDomain = environment.vars.CLOUDFLARE_ACCESS_TEAM_DOMAIN;
    const audience = environment.vars.CLOUDFLARE_ACCESS_AUD;
    if (teamDomain !== undefined || audience !== undefined) {
      assert.match(teamDomain, /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/);
      assert.match(audience, /^[a-f0-9]{64}$/);
    }
  }
});

test("deployment docs describe the Cloudflare Access setup for the submissions admin", async () => {
  const docs = await readFile(new URL("../docs/deployment.md", import.meta.url), "utf8");

  for (const token of [
    "/admin",
    "/admin/*",
    "One-Time PIN",
    "exact email",
    "CLOUDFLARE_ACCESS_TEAM_DOMAIN",
    "CLOUDFLARE_ACCESS_AUD",
    "0002",
  ]) {
    assert.ok(docs.includes(token), `expected deployment docs to mention "${token}"`);
  }

  assert.match(docs, /d1 migrations apply sisters-with-mirrors-submissions-dev --remote/);
  assert.match(docs, /d1 migrations apply sisters-with-mirrors-submissions-prod --remote/);
  assert.match(docs, /\/admin\/submissions\//);
  assert.match(docs, /\/admin\/submissions\/.*\//);
});

test(".dev.vars.example documents Access values without a real administrator email", async () => {
  const devVars = await readFile(new URL("../.dev.vars.example", import.meta.url), "utf8");

  assert.match(devVars, /CLOUDFLARE_ACCESS_TEAM_DOMAIN/);
  assert.match(devVars, /CLOUDFLARE_ACCESS_AUD/);
  assert.doesNotMatch(devVars, /@sisterswithmirrors\.com/);
});
