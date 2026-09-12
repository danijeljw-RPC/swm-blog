import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("homepage renders the request-local Moon inside Explore the mirror without global caching", async () => {
  const source = await readSource("../src/pages/index.astro");

  assert.match(source, /import MoonPhaseCard from "\.\.\/components\/moon\/MoonPhaseCard\.astro"/);
  assert.match(source, /const moon = getMoonPhaseViewModel\(Astro\.request\)/);
  assert.match(source, /Astro\.response\.headers\.set\("Cache-Control", "private, no-store"\)/);
  assert.match(source, /<section class="mirror-preview page-section">[\s\S]*<MoonPhaseCard moon=\{moon\} variant="home" \/>[\s\S]*<\/section>/);
  assert.match(source, /mirror-tile--tarot/);
  assert.match(source, /mirror-tile--colour/);
  assert.match(source, /mirror-tile--number/);
  assert.match(source, /mirror-tile--cosmic/);
});

test("Daily Mirror renders the same request-local Moon after its tarot reading", async () => {
  const source = await readSource("../src/pages/daily-mirror/index.astro");

  assert.match(source, /import MoonPhaseCard from "\.\.\/\.\.\/components\/moon\/MoonPhaseCard\.astro"/);
  assert.match(source, /const moon = getMoonPhaseViewModel\(Astro\.request\)/);
  assert.match(source, /Astro\.response\.headers\.set\("Cache-Control", "private, no-store"\)/);
  assert.match(source, /<article class="mirror-card framed-panel">[\s\S]*<\/article>\s*<MoonPhaseCard moon=\{moon\} variant="daily" \/>/);
  assert.match(source, /<MoonPhaseCard moon=\{moon\} variant="daily" \/>[\s\S]*<p class="daily-note">/);
});
