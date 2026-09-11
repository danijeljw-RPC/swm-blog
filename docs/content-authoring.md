# Episode content authoring

Episode articles are Markdown files in `src/content/episodes/`. Frontmatter supplies every platform button, audio player field, category link and RSS value; do not repeat those links in the article body.

## Create a weekly episode

Start from the editorial branch:

```bash
git checkout dev
git pull
npm ci
npm run new:episode
```

The generator asks for the episode number, title, publication date, short description, categories, optional audio URL, optional YouTube and Spotify URLs, and optional artwork. If audio is supplied, it also asks for the exact file byte length required by RSS. If artwork is supplied, it asks for meaningful alt text.

The generated episode starts as `draft: true`.

1. Edit the generated Markdown in `src/content/episodes/`.
2. Put episode artwork below `public/images/episodes/`, then use a root-relative path such as `/images/episodes/2026/09/swm-002-cover.webp`.
3. Add the immutable Cloudflare R2 custom-domain audio URL when available.
4. Add platform URLs to frontmatter only.
5. Change `draft` to `false` when the episode is ready to publish.
6. Validate and preview:

```bash
npm test
npm run check
npm run validate:content
npm run dev
```

7. Commit and push to `dev`.
8. Verify the development deployment after Phase 2 configures it.
9. Open a pull request from `dev` to `main`.
10. Merge only after review and successful CI.

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
  youtube: null
  spotify: null
  vimeo: null
podcast:
  spotify: null
  apple: null
  amazon: null
  iheart: null
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

## Listen or watch

Platform links are rendered automatically from frontmatter.
```

## RSS enclosure rule

An episode enters `/rss.xml` only when all three audio values are valid:

```yaml
audio:
  url: "https://media.sisterswithmirrors.com/audio/YYYY/MM/file.mp3"
  mimeType: "audio/mpeg"
  bytes: 12345678
```

`bytes` is the exact positive file size, not zero or an estimate. Episodes without a complete enclosure can still publish as articles but are deliberately excluded from RSS.
