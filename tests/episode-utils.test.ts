import assert from "node:assert/strict";
import test from "node:test";

import { isCategoryKey } from "../src/config/categories.ts";
import { getConfiguredPlatforms } from "../src/utils/links.ts";
import {
  getEpisodesByCategory,
  getPublishedEpisodes,
} from "../src/utils/episodes.ts";
import { hasCompleteEnclosure } from "../src/utils/rss.ts";

const makeEpisode = (overrides: Record<string, unknown> = {}) => ({
  id: "episode.md",
  data: {
    title: "Episode",
    slug: "episode",
    episode: 1,
    publishedAt: new Date("2026-09-01T00:00:00+09:30"),
    draft: false,
    categories: ["consciousness"],
    ...overrides,
  },
});

test("category guard accepts stable keys and rejects display labels", () => {
  assert.equal(isCategoryKey("consciousness"), true);
  assert.equal(isCategoryKey("psychic-development"), true);
  assert.equal(isCategoryKey("Consciousness"), false);
  assert.equal(isCategoryKey("unknown"), false);
});

test("configured platform filtering removes blank destinations", () => {
  const result = getConfiguredPlatforms({
    rss: { label: "RSS", url: "/rss.xml" },
    spotify: { label: "Spotify", url: "" },
    youtube: { label: "YouTube", url: " https://youtube.example/show " },
  });

  assert.deepEqual(result, [
    { id: "rss", label: "RSS", url: "/rss.xml" },
    {
      id: "youtube",
      label: "YouTube",
      url: "https://youtube.example/show",
    },
  ]);
});

test("published episodes exclude drafts and sort newest first", () => {
  const older = makeEpisode({ slug: "older", episode: 1 });
  const newer = makeEpisode({
    slug: "newer",
    episode: 2,
    publishedAt: new Date("2026-09-08T00:00:00+09:30"),
  });
  const draft = makeEpisode({
    slug: "draft",
    episode: 3,
    draft: true,
    publishedAt: new Date("2026-09-09T00:00:00+09:30"),
  });

  assert.deepEqual(
    getPublishedEpisodes([older, draft, newer]).map((entry) => entry.data.slug),
    ["newer", "older"],
  );
});

test("category filtering uses stable exact keys", () => {
  const spiritual = makeEpisode({
    slug: "spiritual",
    categories: ["spirituality", "personal-growth"],
  });
  const cosmic = makeEpisode({ slug: "cosmic", categories: ["universe"] });

  assert.deepEqual(
    getEpisodesByCategory([spiritual, cosmic], "personal-growth").map(
      (entry) => entry.data.slug,
    ),
    ["spiritual"],
  );
});

test("RSS enclosure requires URL, MIME type, and positive integer bytes", () => {
  assert.equal(
    hasCompleteEnclosure({
      audio: {
        url: "https://media.example/audio.mp3",
        mimeType: "audio/mpeg",
        bytes: 1024,
      },
    }),
    true,
  );
  assert.equal(hasCompleteEnclosure({ audio: null }), false);
  assert.equal(
    hasCompleteEnclosure({
      audio: {
        url: "https://media.example/audio.mp3",
        mimeType: "audio/mpeg",
        bytes: 0,
      },
    }),
    false,
  );
});
