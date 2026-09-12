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
  assert.match(source, /<div class="moon-card-slot">\s*<MoonPhaseCard moon=\{moon\} variant="home" \/>\s*<\/div>/);
  assert.match(source, /\.moon-card-slot \{ grid-column: 1 \/ -1; \}/);
  assert.match(source, /mirror-tile--tarot/);
  assert.match(source, /mirror-tile--colour/);
  assert.match(source, /mirror-tile--number/);
  assert.match(source, /mirror-tile--cosmic/);
});

test("Daily Mirror renders the request-local Moon as a compact linked insight", async () => {
  const source = await readSource("../src/pages/daily-mirror/index.astro");

  assert.match(source, /import MoonPhaseVisual from "\.\.\/\.\.\/components\/moon\/MoonPhaseVisual\.astro"/);
  assert.match(source, /const moon = getMoonPhaseViewModel\(Astro\.request\)/);
  assert.match(source, /Astro\.response\.headers\.set\("Cache-Control", "private, no-store"\)/);
  assert.match(source, /<dt>Today’s Moon<\/dt>[\s\S]*<a[^>]+href="\/moon\/"[\s\S]*<MoonPhaseVisual phase=\{moon\.phase\} label=\{moon\.name\} size="tiny"[\s\S]*<small>\{moon\.name\}<\/small>/);
  assert.doesNotMatch(source, /<MoonPhaseCard moon=\{moon\}/);
  assert.match(source, /\.insights \{[^}]*border-top: 1px solid var\(--swm-border-soft\);[^}]*\}/);
  assert.doesNotMatch(source, /\.insights \{[^}]*border-block:/);
});

test("dedicated Moon page renders visitor-local phase content without global caching", async () => {
  const source = await readSource("../src/pages/moon/index.astro");

  assert.match(source, /<BaseLayout\s+title="Today’s Moon Phase"/);
  assert.match(source, /Discover today’s Moon phase and explore its meaning, energy, focus and reflection through Sisters with Mirrors\./);
  assert.match(source, /const moon = getMoonPhaseViewModel\(Astro\.request\)/);
  assert.match(source, /Astro\.response\.headers\.set\("Cache-Control", "private, no-store"\)/);
  assert.match(source, /<MoonPhaseVisual phase=\{moon\.phase\} label=\{moon\.name\} size="large" \/>/);
  assert.match(source, /Today’s Moon · \{moon\.date\}/);
  assert.match(source, /<h1>\{moon\.name\}<\/h1>/);
  assert.match(source, />Meaning</);
  assert.match(source, />Energy</);
  assert.match(source, />What to focus on</);
  assert.match(source, />Reflection</);
  assert.match(source, />Practices</);
  assert.match(source, /moon\.focus\.map/);
  assert.match(source, /moon\.reflection\.map/);
  assert.match(source, /moon\.practices\.map/);
});
