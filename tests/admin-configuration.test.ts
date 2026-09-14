import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("all Cloudflare environments declare replace-before-deploy Access settings", async () => {
  const config = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  const environments = [config, config.env.development, config.env.production];

  for (const environment of environments) {
    assert.equal(typeof environment.vars.CLOUDFLARE_ACCESS_TEAM_DOMAIN, "string");
    assert.notEqual(environment.vars.CLOUDFLARE_ACCESS_TEAM_DOMAIN.trim(), "");
    assert.equal(typeof environment.vars.CLOUDFLARE_ACCESS_AUD, "string");
    assert.notEqual(environment.vars.CLOUDFLARE_ACCESS_AUD.trim(), "");
  }
});
