import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";

const root = new URL("..", import.meta.url);

for (const [environment, rejectedBranch] of [
  ["dev", "main"],
  ["prod", "dev"],
] as const) {
  for (const operation of ["build", "deploy"] as const) {
    test(`${environment} ${operation} refuses ${rejectedBranch} before doing work`, () => {
      const script = new URL(`../scripts/ci-${operation}-${environment}.sh`, import.meta.url);
      const result = spawnSync("bash", [script.pathname], {
        cwd: root,
        env: { ...process.env, WORKERS_CI_BRANCH: rejectedBranch },
        encoding: "utf8",
      });
      assert.equal(result.status, 0, result.stderr);
      assert.match(result.stdout, new RegExp(`${environment.toUpperCase()} ${operation} refused for branch '${rejectedBranch}'`));
      assert.doesNotMatch(result.stdout + result.stderr, /npm ci|astro build|wrangler/);
    });

  }
}
