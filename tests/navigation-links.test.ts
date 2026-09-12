import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const workspaceRoot = new URL("../", import.meta.url);

async function readSource(path: string) {
  return readFile(new URL(path, workspaceRoot), "utf8");
}

test("footer separates general links from the complete Explore collection", async () => {
  const footer = await readSource("src/components/layout/Footer.astro");

  assert.match(footer, /<nav aria-label="Useful links">[\s\S]*Episodes[\s\S]*Hosts[\s\S]*Listen[\s\S]*<\/nav>/);
  assert.match(footer, /<nav aria-label="Explore">[\s\S]*<a href="\/moon\/">Moon<\/a>/);
  assert.match(footer, /<nav aria-label="Explore">[\s\S]*<a href="\/astrology\/birth-chart\/">Birth Chart<\/a>/);
  assert.match(footer, /<a href="\/astrology\/elements\/">Elements<\/a>/);
  assert.match(footer, /<a href="\/chakras\/">Chakras<\/a>/);
  assert.match(footer, /<a href="\/numerology\/">Numerology<\/a>/);
});

test("numerology is data-driven and the daily number links to its detail page", async () => {
  const home = await readSource("src/pages/index.astro");
  const detail = await readSource("src/pages/numerology/[number].astro");
  assert.match(home, /href=\{`\/numerology\/\$\{numberOfTheDay\}\/`\}/);
  assert.match(detail, /getStaticPaths\(\)/);
  assert.match(detail, /entry\.sources\.map/);
  assert.match(detail, /entry\.strengths\.map/);
  assert.match(detail, /entry\.challenges\.map/);
});

test("primary navigation keeps Chakras in the footer", async () => {
  const header = await readSource("src/components/layout/Header.astro");

  assert.doesNotMatch(header, /\["Chakras", "\/chakras\/"\]/);
});
