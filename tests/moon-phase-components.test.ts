import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("moon phase card presents current JSON content as one accessible link", async () => {
  const source = await readFile(
    new URL("../src/components/moon/MoonPhaseCard.astro", import.meta.url),
    "utf8",
  );

  assert.match(source, /href="\/moon\/"/);
  assert.match(source, /Today’s Moon/);
  assert.match(source, /\{moon\.name\}/);
  assert.match(source, /\{moon\.summary\}/);
  assert.match(source, /Explore the Moon phase/);
  assert.match(source, /<MoonPhaseVisual phase=\{moon\.phase\} label=\{moon\.name\}/);
});

test("moon phase visual uses the canonical image and accessible alt behavior", async () => {
  const source = await readFile(
    new URL("../src/components/moon/MoonPhaseVisual.astro", import.meta.url),
    "utf8",
  );

  assert.match(source, /MOON_PHASE_IMAGES\[phase\]/);
  assert.match(source, /alt=\{decorative \? "" : `\$\{label\} Moon phase`\}/);
  assert.match(source, /width="240"/);
  assert.match(source, /height="240"/);
  assert.match(source, /size\?: "tiny" \| "compact" \| "large"/);
  assert.match(source, /\.moon-visual--tiny \{ width: 2\.25rem; \}/);
});
