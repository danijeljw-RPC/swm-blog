import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("about content uses the full site column instead of a constrained reading width", async () => {
  const aboutPage = await readFile(new URL("../src/pages/about/index.astro", import.meta.url), "utf8");

  assert.match(aboutPage, /class="about-heading"/);
  assert.match(aboutPage, /\.about-heading :global\(\.section-heading\) \{ max-width: none; \}/);
  assert.match(aboutPage, /\.about-copy \{ max-width: none;/);
});
