import assert from "node:assert/strict";
import test from "node:test";

import {
  buildEpisodeFilename,
  parseCategories,
  renderEpisodeMarkdown,
  slugify,
} from "../scripts/lib/episode-authoring.mjs";

test("slugify normalizes punctuation, accents, and repeated separators", () => {
  assert.equal(slugify("  Café & Consciousness: Part II!  "), "cafe-consciousness-part-ii");
});

test("parseCategories accepts stable keys and rejects unknown values", () => {
  assert.deepEqual(parseCategories("consciousness, personal-growth"), [
    "consciousness",
    "personal-growth",
  ]);
  assert.throws(() => parseCategories("Consciousness"), /Unknown category/);
});

test("buildEpisodeFilename includes date, padded number, and slug", () => {
  assert.equal(
    buildEpisodeFilename({ episode: 7, publishedAt: "2026-09-12", title: "A New Mirror" }),
    "2026-09-12-swm-007-a-new-mirror.md",
  );
});

test("renderEpisodeMarkdown quotes YAML and leaves optional links null", () => {
  const markdown = renderEpisodeMarkdown({
    episode: 7,
    title: 'A Mirror: "Reflected"',
    publishedAt: "2026-09-12",
    description: "Clearly labelled fixture description.",
    categories: ["consciousness"],
    audioUrl: "",
    youtubeUrl: "",
    spotifyUrl: "",
    heroImage: "",
  });

  assert.match(markdown, /title: 'A Mirror: "Reflected"'/);
  assert.match(markdown, /youtube: null/);
  assert.match(markdown, /hosted: null/);
  assert.doesNotMatch(markdown, /vimeo:/);
  assert.match(markdown, /audio: null/);
  assert.match(markdown, /## In this episode/);
  assert.doesNotMatch(markdown, /## Listen or watch/);
  assert.doesNotMatch(markdown, /Platform links are rendered automatically/);
});

test("renderEpisodeMarkdown requires alt text when artwork is supplied", () => {
  assert.throws(
    () =>
      renderEpisodeMarkdown({
        episode: 8,
        title: "Artwork episode",
        publishedAt: "2026-09-19",
        description: "Description.",
        categories: ["consciousness"],
        heroImage: "/images/episodes/art.webp",
        heroImageAlt: "",
      }),
    /Hero image alt text is required/,
  );
});
