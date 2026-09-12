import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("latest episode artwork is fully visible instead of cropped", async () => {
  const episodeHero = await readFile(
    new URL("../src/components/episodes/EpisodeHero.astro", import.meta.url),
    "utf8",
  );

  assert.match(episodeHero, /img \{[^}]*object-fit: contain;/s);
});
