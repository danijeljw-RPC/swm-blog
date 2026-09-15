import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
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

for (const environment of ["dev", "prod"] as const) {
  test(`${environment} Workers Builds run relies on the platform dependency install`, () => {
    const directory = mkdtempSync(path.join(tmpdir(), `swm-${environment}-build-`));
    const npm = path.join(directory, "npm");
    const calls = path.join(directory, "npm-calls.txt");
    writeFileSync(npm, `#!/usr/bin/env bash\nprintf '%s\\n' "$*" >> "${calls}"\n`);
    chmodSync(npm, 0o755);

    try {
      const script = new URL(`../scripts/ci-build-${environment}.sh`, import.meta.url);
      const result = spawnSync("bash", [script.pathname], {
        cwd: root,
        env: {
          ...process.env,
          PATH: `${directory}:${process.env.PATH}`,
          WORKERS_CI: "1",
          WORKERS_CI_BRANCH: environment === "dev" ? "dev" : "main",
        },
        encoding: "utf8",
      });

      assert.equal(result.status, 0, result.stderr);
      assert.equal(readFileSync(calls, "utf8"), `run build:${environment}\n`);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
}
