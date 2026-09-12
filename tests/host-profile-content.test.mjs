import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";

const root = process.cwd();

test("DJ's host page publishes the supplied biography instead of placeholder copy", async () => {
  const page = await readFile(path.join(root, "src/pages/hosts/dj.astro"), "utf8");

  assert.doesNotMatch(page, /Profile placeholder|Biography, portrait and profile links have not yet been supplied/);
  assert.match(page, /About DJ/);
  assert.match(page, /Memories of the future/);
  assert.match(page, /Dreams, aliens and energy/);
  assert.match(page, /In DJ[’']s experience/);
  assert.match(page, /President of the Intergalactic Consortium of Laughing at Oneself/);
});

test("DJ's short host bio includes the newly supplied interests", async () => {
  const hosts = JSON.parse(await readFile(path.join(root, "src/data/hosts.json"), "utf8"));
  const dj = hosts.find(({ id }) => id === "dj");

  assert.match(dj.shortBio, /aliens/);
  assert.match(dj.shortBio, /mysticism/);
});
