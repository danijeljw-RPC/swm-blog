import assert from "node:assert/strict";
import test from "node:test";

import { resolveMediaUrl } from "../src/utils/media-url.ts";

test("root-relative media paths use the configured media origin", () => {
  assert.equal(
    resolveMediaUrl("/podcasts/season-01/episode-001/audio.mp3", "https://media.example/"),
    "https://media.example/podcasts/season-01/episode-001/audio.mp3",
  );
});

test("absolute HTTPS media URLs remain unchanged", () => {
  assert.equal(
    resolveMediaUrl("https://external.example/audio.mp3", "https://media.example"),
    "https://external.example/audio.mp3",
  );
});

test("unsupported media URL formats are rejected", () => {
  assert.throws(() => resolveMediaUrl("audio/episode.mp3", "https://media.example"), /root-relative path or an HTTPS URL/);
  assert.throws(() => resolveMediaUrl("http://media.example/audio.mp3", "https://media.example"), /root-relative path or an HTTPS URL/);
});
