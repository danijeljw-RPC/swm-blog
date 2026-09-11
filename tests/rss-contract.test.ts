import assert from "node:assert/strict";
import test from "node:test";

import { serializePodcastRss } from "../src/utils/rss.ts";

const channel = {
  title: "Sisters & Mirrors",
  link: "https://example.com",
  selfUrl: "https://example.com/rss.xml",
  description: "Look < into the mirror",
  language: "en-AU",
};

test("RSS serialization emits a valid empty podcast channel", () => {
  const xml = serializePodcastRss(channel, []);
  assert.match(xml, /^<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(xml, /xmlns:itunes="http:\/\/www\.itunes\.com\/dtds\/podcast-1\.0\.dtd"/);
  assert.match(xml, /xmlns:atom="http:\/\/www\.w3\.org\/2005\/Atom"/);
  assert.match(xml, /<title>Sisters &amp; Mirrors<\/title>/);
  assert.match(xml, /<description>Look &lt; into the mirror<\/description>/);
  assert.doesNotMatch(xml, /<item>/);
});

test("RSS serialization includes only episodes with complete enclosures", () => {
  const complete = {
    data: {
      title: "One & Only",
      slug: "one-only",
      episode: 4,
      description: "Episode <description>",
      publishedAt: new Date("2026-09-10T00:00:00Z"),
      duration: "56:27",
      audio: {
        url: "https://media.example/audio.mp3?x=1&y=2",
        mimeType: "audio/mpeg",
        bytes: 2048,
      },
    },
  };
  const incomplete = {
    data: {
      title: "Missing audio",
      slug: "missing-audio",
      episode: 5,
      description: "Not in feed",
      publishedAt: new Date("2026-09-11T00:00:00Z"),
      duration: null,
      audio: null,
    },
  };

  const xml = serializePodcastRss(channel, [complete, incomplete]);
  assert.match(xml, /<title>One &amp; Only<\/title>/);
  assert.match(xml, /<guid isPermaLink="true">https:\/\/example\.com\/episodes\/one-only\/<\/guid>/);
  assert.match(xml, /<pubDate>Thu, 10 Sep 2026 00:00:00 GMT<\/pubDate>/);
  assert.match(xml, /<enclosure url="https:\/\/media\.example\/audio\.mp3\?x=1&amp;y=2" length="2048" type="audio\/mpeg" \/>/);
  assert.match(xml, /<itunes:duration>56:27<\/itunes:duration>/);
  assert.match(xml, /<itunes:episode>4<\/itunes:episode>/);
  assert.doesNotMatch(xml, /Missing audio/);
});
