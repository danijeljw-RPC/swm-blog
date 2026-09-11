import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workspaceRoot = new URL("../", import.meta.url);

async function readSource(path: string) {
  return readFile(new URL(path, workspaceRoot), "utf8");
}

test("footer exposes the Elements and Chakras reference homepages", async () => {
  const footer = await readSource("src/components/layout/Footer.astro");

  assert.match(footer, /<a href="\/astrology\/elements\/">Elements<\/a>/);
  assert.match(footer, /<a href="\/chakras\/">Chakras<\/a>/);
});

test("primary navigation keeps Chakras in the footer", async () => {
  const header = await readSource("src/components/layout/Header.astro");

  assert.doesNotMatch(header, /\["Chakras", "\/chakras\/"\]/);
});
