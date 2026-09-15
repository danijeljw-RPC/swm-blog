# Episode content authoring

Episode articles are Markdown files in `src/content/episodes/`. Frontmatter supplies episode-specific video, audio, category, and podcast-feed values; do not repeat those links in the article body. Show-level directory links belong in `src/config/podcast.ts`.

## Create a weekly episode

Start from the editorial branch:

```bash
git checkout dev
git pull
npm ci
npm run new:episode
```

The generator asks for the season and episode number, title, publication date, short description, categories, optional public MP3 URL, optional YouTube and Spotify-video URLs, and optional artwork. If audio is supplied, it also asks for the exact file byte length required by the podcast RSS enclosure.

The generated episode starts as `draft: true`.

1. Edit the generated Markdown in `src/content/episodes/`.
2. Put episode artwork below `public/images/episodes/`, then use a root-relative path such as `/images/episodes/2026/09/swm-002-cover.webp`.
3. Embed the finished MP3's ID3 tags before uploading it. The site cannot add or alter ID3 data after upload.
4. Upload the final MP3 and MP4 to R2; use each full, public URL exactly as supplied. This may be a temporary `https://pub-…r2.dev/path/to/file` URL before the production custom domain is mapped.
5. Add the MP3 URL, MIME type, and exact byte size in `audio`; this is the complete RSS enclosure contract.
6. Add the R2-hosted video, YouTube, and Spotify-video URL in `video`. A populated `video.hosted` creates the first-party watch page; YouTube and Spotify remain external links.
7. Set `podcast.season`, `episodeType`, and `explicit` accurately. Leave `guid` blank unless you have an existing immutable GUID; the site uses its permanent article URL as the fallback GUID.
8. Change `draft` to `false` when the episode is ready to publish.
9. Validate and preview:

```bash
npm test
npm run check
npm run validate:content
npm run dev
```

10. Commit and push to `dev`.
11. Verify the development deployment after Phase 2 configures it.
12. Open a pull request from `dev` to `main`.
13. Merge only after review and successful CI.

## Controlled category keys

Use the stable keys printed by `npm run new:episode`. The current keys are:

```text
consciousness, spirituality, energy, universe, psychic-development,
afterlife, extraterrestrial, tarot, chakras, astrology, numerology,
personal-growth, mystery
```

Tags are free-form lowercase slugs and may be more specific.

## Complete example

This example shows structure only. Its values are explicitly illustrative and must be replaced with real episode metadata.

```markdown
---
title: "Fixture: Replace with the episode title"
slug: "fixture-replace-with-the-episode-title"
episode: 2
publishedAt: 2026-09-17
updatedAt: 2026-09-17
draft: true
fixture: true
excerpt: "Fixture excerpt to replace before publication."
description: "Fixture description to replace before publication."
categories:
  - consciousness
tags:
  - fixture
heroImage: "/images/episodes/fixture-episode-artwork.svg"
heroImageAlt: "Abstract fixture artwork"
duration: null
audio: null
video:
  hosted: null
  youtube: null
  spotify: null
podcast:
  guid: null
  season: 1
  episodeType: full
  explicit: null
transcript: null
hosts:
  - dj
  - warren
seo:
  canonical: null
  noindex: true
---

## In this episode

Replace this fixture introduction.

## Topics from the mirror

Add the main discussion notes.

## Questions from the mirror

Add reflective questions.
```

The article page infers whether an entry is text-only or an episode from its
`audio` and `video` values. Do not add a manual "Listen or watch" section: when
at least one real media URL is present, the page creates a compact media panel
after the article. Text-only articles do not render that panel.

## Podcast RSS enclosure rule

An episode enters the public podcast feed at `/rss.xml` only when all three audio values are valid:

```yaml
audio:
  url: "/podcasts/season-01/episode-001/episode.mp3"
  mimeType: "audio/mpeg"
  bytes: 12345678
video:
  hosted: "/podcasts/season-01/episode-001/episode.mp4"
transcript: "/podcasts/season-01/episode-001/episode.vtt"
```

Root-relative audio, hosted-video, and transcript paths are resolved against
`PUBLIC_MEDIA_URL`. Use a complete `https://` URL instead when media is hosted
elsewhere; complete HTTPS URLs are preserved unchanged.

`bytes` is the exact positive file size, not zero or an estimate. Episodes without a complete enclosure can still publish as articles but are deliberately excluded from the podcast feed. The blog feed is `/blog.xml`; it publishes articles without an audio enclosure.

## One-time launch setup

Before submitting the podcast feed to Apple, iHeartRadio, or another directory, fill in the global show metadata in `src/config/podcast.ts`: show artwork URL, owner name, public contact email, explicit-content setting, and each directory's show URL after approval. Do not add those show URLs to individual episodes.

The crawler-facing sitemap index is `/sitemap-index.xml`. `robots.txt` points search engines to it automatically.
