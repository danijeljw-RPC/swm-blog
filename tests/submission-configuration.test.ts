import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("deployed environments isolate D1, sessions, routes, and hostname configuration", async () => {
  const config = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  assert.deepEqual(Object.keys(config.env).sort(), ["dev", "prod"]);
  assert.deepEqual(config.env.dev.d1_databases, [{
    binding: "SUBMISSIONS_DB",
    database_name: "sisters-with-mirrors-submissions-dev",
    database_id: "f73f4f7b-6b95-4ed3-8f2b-bfd990abf8f1",
    migrations_dir: "migrations",
  }]);
  assert.deepEqual(config.env.prod.d1_databases, [{
    binding: "SUBMISSIONS_DB",
    database_name: "sisters-with-mirrors-submissions-prod",
    database_id: "47fdbd25-5492-4159-ac6b-983fbdc9f2ac",
    migrations_dir: "migrations",
  }]);
  assert.equal(config.env.dev.name, "swm-blog-dev");
  assert.equal(config.env.prod.name, "swm-blog-prod");
  assert.match(config.env.dev.kv_namespaces[0].id, /^[a-f0-9]{32}$/);
  assert.match(config.env.prod.kv_namespaces[0].id, /^[a-f0-9]{32}$/);
  assert.notEqual(config.env.dev.kv_namespaces[0].id, config.env.prod.kv_namespaces[0].id);
  assert.deepEqual(config.env.dev.kv_namespaces.map((item: { binding: string }) => item.binding), ["SESSION"]);
  assert.deepEqual(config.env.prod.kv_namespaces.map((item: { binding: string }) => item.binding), ["SESSION"]);
  assert.deepEqual(config.env.dev.routes, [{ pattern: "dev.sisterswithmirrors.com", custom_domain: true }]);
  assert.deepEqual(config.env.prod.routes, [{ pattern: "sisterswithmirrors.com", custom_domain: true }]);
  assert.equal(config.env.dev.vars.PUBLIC_SITE_URL, "https://dev.sisterswithmirrors.com");
  assert.equal(config.env.prod.vars.PUBLIC_SITE_URL, "https://sisterswithmirrors.com");
  assert.equal(config.env.dev.vars.SUBMISSIONS_ALLOWED_HOSTNAMES, "dev.sisterswithmirrors.com");
  assert.equal(config.env.prod.vars.SUBMISSIONS_ALLOWED_HOSTNAMES, "sisterswithmirrors.com");
  assert.equal("TURNSTILE_TEST_MODE" in config.env.dev.vars, false);
  assert.equal("TURNSTILE_TEST_MODE" in config.env.prod.vars, false);
});
