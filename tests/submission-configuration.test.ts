import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("submission databases use the stable binding in their matching environments", async () => {
  const config = JSON.parse(await readFile(new URL("../wrangler.jsonc", import.meta.url), "utf8"));
  assert.deepEqual(config.d1_databases.map((database: { binding: string }) => database.binding), ["SUBMISSIONS_DB"]);
  assert.deepEqual(config.env.development.d1_databases, [{
    binding: "SUBMISSIONS_DB",
    database_name: "sisters-with-mirrors-submissions-dev",
    database_id: "f73f4f7b-6b95-4ed3-8f2b-bfd990abf8f1",
    migrations_dir: "migrations",
  }]);
  assert.deepEqual(config.env.production.d1_databases, [{
    binding: "SUBMISSIONS_DB",
    database_name: "sisters-with-mirrors-submissions-prod",
    database_id: "47fdbd25-5492-4159-ac6b-983fbdc9f2ac",
    migrations_dir: "migrations",
  }]);
});
