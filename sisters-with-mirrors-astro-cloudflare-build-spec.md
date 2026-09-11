# Sisters with Mirrors — Astro + Cloudflare Website Build Specification

## 1. Objective

Build the **Sisters with Mirrors** website as a responsive Astro site focused primarily on:

1. Weekly podcast/videocast episode articles.
2. Audio/video listening and viewing links.
3. A first-party podcast RSS feed whose audio files are hosted in Cloudflare R2.
4. Host profile/about pages for DJ and Warren.
5. A "Daily Mirror" interactive page with:
   - Tarot card of the day
   - Upright/reversed tarot result
   - Chakra
   - Colour
   - Number
6. A Daily Astrology page driven **only by our own JSON data**.
7. A dark, celestial, elegant visual style matching the existing Sisters with Mirrors video artwork.
8. Automatic deployment from GitHub:
   - `dev` branch → development site
   - `main` branch → production site
   - normal workflow is feature work → `dev` → review → pull request → `main`

The site should be serious, mystical and polished, but still have room for fun interactive features. Avoid making it look like a generic "witchy template", gaming site, or bright SaaS dashboard.

---

# 2. Required technology

Use:

- **Astro**
- **TypeScript**
- Native CSS / CSS Modules / Astro component-scoped CSS
- Astro Content Collections for articles
- Markdown or MDX for article content
- Zod schemas for JSON/content validation
- Cloudflare Workers for deployment
- Cloudflare R2 for episode audio/media
- GitHub Actions for CI/CD
- `wrangler` for Cloudflare deployment

Do **not** introduce Tailwind unless there is a concrete technical reason that materially improves the project.

The preferred approach is semantic HTML plus a small, intentional CSS design system using CSS custom properties.

The site should remain mostly static. Client JavaScript should only be used where it adds actual functionality, such as the Daily Mirror interaction, copy/share controls, media players, and runtime loading of daily astrology JSON.

Cloudflare currently recommends Workers for new Astro deployments, and Wrangler supports separate Worker environments. The target design is therefore **Astro deployed to Cloudflare Workers**, rather than creating a new Cloudflare Pages project unless a specific blocker makes Workers unsuitable.

---

# 3. Existing visual reference

The existing two-speaker video layout is the visual reference for the website.

Expected reference asset:

```text
design/reference/swm-2-speaker-default.png
```

If the file is not present, **ask me for it before attempting to reproduce the visual language from imagination**.

Important: the bright green video placeholders in that artwork are chroma-key areas and **are not part of the website palette**.

Primary known colours:

```css
--swm-gold: #A98853;
--swm-ivory: #D7CCB8;
```

Build an extended palette around those colours, using the reference artwork rather than arbitrary colours.

Suggested starting tokens:

```css
:root {
  --swm-bg: #07070b;
  --swm-bg-soft: #0d0b11;
  --swm-panel: #111017;
  --swm-panel-raised: #17131c;

  --swm-gold: #A98853;
  --swm-ivory: #D7CCB8;

  --swm-text: #eee9df;
  --swm-text-muted: #a69ca5;
  --swm-border: rgba(169, 136, 83, 0.38);
  --swm-border-soft: rgba(215, 204, 184, 0.16);

  --swm-purple: #261229;
  --swm-purple-soft: #180d1b;

  --swm-max-width: 1240px;
}
```

Treat these secondary values as initial design values, not immutable branding.

## Typography

The existing artwork uses a high-contrast serif for the main title.

Preferred pattern:

- Display/headings: **Playfair Display** or a similarly elegant open-source serif.
- Body/UI: a highly readable sans-serif such as **Inter**, **Source Sans 3**, or system sans-serif.
- Tracking can be widened for small uppercase section labels.
- Do not overuse all-caps text.

If Playfair Display is used, load it through a normal web-font dependency or self-hosted project asset. Do not depend on a font path from a developer workstation.

---

# 4. Visual direction

The overall layout should carry forward these motifs from the supplied artwork:

- near-black background
- muted purple nebula/cloud textures
- aged gold lines and frames
- ivory typography
- celestial geometry
- moons, stars and constellations
- fine-line occult/esoteric iconography
- generous spacing
- restrained glow rather than neon
- thin borders rather than chunky cards

Avoid:

- bright green
- excessive gradients
- oversized rounded SaaS cards
- excessive glassmorphism
- heavy animation
- "Halloween" styling
- generic AI-generated mystical imagery everywhere
- making every component gold

The site needs to remain readable and credible as an article publication.

---

# 5. Proposed site structure

Use routes approximately like this:

```text
/
├── episodes/
│   ├── index.astro
│   └── [...slug].astro
├── categories/
│   ├── index.astro
│   └── [category].astro
├── hosts/
│   ├── index.astro
│   ├── dj.astro
│   └── warren.astro
├── daily-mirror/
│   └── index.astro
├── astrology/
│   └── index.astro
├── listen/
│   └── index.astro
├── about/
│   └── index.astro
├── rss.xml.ts
├── 404.astro
└── index.astro
```

Optional routes that can be added if useful:

```text
/archive/
search/
privacy/
contact/
```

Do not add routes merely to fill navigation.

---

# 6. Navigation

Desktop navigation:

```text
Sisters with Mirrors
Episodes
Daily Mirror
Daily Astrology
About
Listen
```

Mobile navigation should collapse cleanly and remain keyboard accessible.

The logo/title should return to `/`.

The main navigation should not contain ten podcast platform icons. Platform links belong in:

- episode pages
- the Listen page
- site footer

---

# 7. Homepage

The homepage should communicate the podcast immediately.

Suggested hierarchy:

## Hero

- Sisters with Mirrors
- "Look Into The Mirror"
- short description of the podcast
- latest episode title
- latest episode artwork
- buttons:
  - Read episode
  - Watch
  - Listen

## Latest episode

Large featured episode panel containing:

- title
- episode number
- publication date
- description/excerpt
- hero image
- category tags
- YouTube/Spotify/audio links
- duration if known

## Recent episodes

Grid/list of the latest 3–6 articles.

## Explore the Mirror

A visually distinctive entry into:

- Tarot Card of the Day
- Chakra
- Colour
- Number
- Daily Astrology

This can preview today's generated Daily Mirror result without overwhelming the homepage.

## Hosts

Compact profile section for DJ and Warren with portraits, short bios and links to full profiles.

## Listen / Watch

Platform icons and direct RSS link.

---

# 8. Episode articles

Episode-related articles are the centre of the site.

Use Astro Content Collections.

Suggested location:

```text
src/content/episodes/
```

Each article can be Markdown or MDX:

```text
src/content/episodes/
  2026-09-05-the-fear-of-letting-go.md
  2026-09-12-example-next-episode.md
```

Prefer Markdown unless embedded interactive components are required. MDX can be supported for exceptional posts.

## Proposed episode frontmatter

```yaml
---
title: "The Fear of Letting Go & Consciousness Beyond"
slug: "the-fear-of-letting-go-consciousness-beyond"
episode: 1
publishedAt: 2026-09-05
updatedAt: 2026-09-05
draft: false

excerpt: "What happens when we stop holding on?"
description: "DJ and Warren discuss letting go, consciousness, source, health, our environment and the possibility of consciousness beyond humanity."

categories:
  - consciousness
  - spirituality
  - extraterrestrial

tags:
  - letting-go
  - source
  - consciousness
  - aliens

heroImage: "/images/episodes/2026-09-05/hero.webp"
heroImageAlt: "Sisters with Mirrors episode artwork"

duration: "56:27"

audio:
  url: "https://media.sisterswithmirrors.com/audio/2026-09-05.mp3"
  mimeType: "audio/mpeg"
  bytes: 0

video:
  youtube: "https://www.youtube.com/watch?v=..."
  spotify: "https://open.spotify.com/episode/..."
  vimeo: null

podcast:
  spotify: "https://open.spotify.com/episode/..."
  apple: null
  amazon: null
  iheart: null

transcript: null

hosts:
  - dj
  - warren

seo:
  canonical: null
  noindex: false
---
```

The schema must validate this frontmatter.

Do not make every URL mandatory. An episode should still build if one distribution platform is not available yet.

For `audio.bytes`, either:

1. require it in frontmatter because RSS enclosure length requires a byte count, or
2. add a build helper capable of obtaining/maintaining it.

Prefer explicit metadata if it avoids fragile remote requests during builds.

---

# 9. Episode content workflow

Adding an episode should be deliberately simple.

Target author workflow:

```bash
npm run new:episode
```

The command should prompt for:

```text
Episode number:
Title:
Publication date:
Short description:
Categories:
R2 audio URL:
YouTube URL:
Spotify URL:
Hero image:
```

It should generate a correctly named Markdown file with all required frontmatter and starter headings.

Example article body:

```md
## In this episode

Introductory article copy.

## Letting go

Discussion...

## Consciousness beyond the physical

Discussion...

## Questions from the mirror

Questions...

## Listen or watch

Platform links are rendered automatically by the page template.
```

Do not force the author to manually recreate platform buttons inside Markdown. Episode metadata should drive those automatically.

Add:

```bash
npm run validate:content
```

This should fail CI for invalid frontmatter, invalid JSON, duplicate slugs or broken internal media references that can be checked locally.

---

# 10. Categories

Start with a controlled category set rather than free-form spelling.

Recommended initial categories:

```text
Consciousness
Spirituality
Energy
The Universe
Psychic Development
Life After Death
Extraterrestrial
Tarot
Chakras
Astrology
Numerology
Personal Growth
Mystery & Unexplained
```

Do not require every episode to fit only one category.

Store stable machine values separately from labels:

```ts
const categories = {
  consciousness: "Consciousness",
  spirituality: "Spirituality",
  energy: "Energy",
  universe: "The Universe",
  psychicDevelopment: "Psychic Development",
  afterlife: "Life After Death",
  extraterrestrial: "Extraterrestrial",
  tarot: "Tarot",
  chakras: "Chakras",
  astrology: "Astrology",
  numerology: "Numerology",
  personalGrowth: "Personal Growth",
  mystery: "Mystery & Unexplained",
} as const;
```

If the content eventually shows that several categories are redundant, consolidate them.

Tags can remain free-form and more specific.

---

# 11. Host profiles

Create reusable host data rather than hard-coding bios in multiple pages.

Suggested:

```text
src/data/hosts.json
```

Example:

```json
[
  {
    "id": "dj",
    "name": "DJ",
    "role": "Host",
    "shortBio": "",
    "bio": "",
    "image": "/images/hosts/dj.webp",
    "links": {}
  },
  {
    "id": "warren",
    "name": "Warren",
    "role": "Co-host",
    "shortBio": "",
    "bio": "",
    "image": "/images/hosts/warren.webp",
    "links": {}
  }
]
```

**Do not invent host biographies. Ask me for the final bios and profile images.**

The site should support future social links without requiring them.

---

# 12. Podcast platform links

Create a central configuration file:

```text
src/config/platforms.ts
```

Example shape:

```ts
export const platforms = {
  rss: {
    label: "RSS",
    url: "/rss.xml",
  },
  spotify: {
    label: "Spotify",
    url: "",
  },
  applePodcasts: {
    label: "Apple Podcasts",
    url: "",
  },
  youtube: {
    label: "YouTube",
    url: "",
  },
  youtubeMusic: {
    label: "YouTube Music",
    url: "",
  },
  amazonMusic: {
    label: "Amazon Music / Audible",
    url: "",
  },
  iheart: {
    label: "iHeartRadio",
    url: "",
  },
  pocketCasts: {
    label: "Pocket Casts",
    url: "",
  },
  castbox: {
    label: "Castbox",
    url: "",
  },
  podcastAddict: {
    label: "Podcast Addict",
    url: "",
  },
  overcast: {
    label: "Overcast",
    url: "",
  },
  goodpods: {
    label: "Goodpods",
    url: "",
  }
} as const;
```

Only display platforms with configured URLs.

Use a consistent icon library where possible, but keep the icon bundle small. Prefer accessible SVG icons.

Every icon-only link requires an `aria-label`.

---

# 13. Distribution targets

The website should have a checklist/documentation section for distribution.

## Primary video

Publish video to:

- YouTube
- Spotify, where the podcast/video workflow supports the episode
- Optional: Vimeo as an additional hosted/archive destination

## Primary podcast/audio directories

The RSS feed should be suitable for submission/distribution to major directories such as:

- Apple Podcasts
- Spotify
- Amazon Music / Audible
- iHeartRadio
- Pocket Casts
- Castbox
- Podcast Addict
- Overcast
- Goodpods

Also review TuneIn and other worthwhile directories at launch because directory submission policies can change.

Do not assume the site needs separate RSS feeds per directory.

The canonical source should be our own RSS feed where the directory permits RSS submission.

Create:

```text
docs/podcast-distribution.md
```

with a checkbox for each platform, its configured show URL and any submission status.

---

# 14. Audio hosting in Cloudflare R2

Use R2 for first-party audio storage.

Recommended production hostname:

```text
media.sisterswithmirrors.com
```

Example object structure:

```text
audio/
  2026/
    09/
      swm-001-the-fear-of-letting-go.mp3

images/
  episodes/
    2026/
      09/
        swm-001-cover.webp
```

Example production URL:

```text
https://media.sisterswithmirrors.com/audio/2026/09/swm-001-the-fear-of-letting-go.mp3
```

Use an R2 **custom domain** for production delivery, not an `r2.dev` URL.

Cloudflare documents `r2.dev` as a development endpoint and recommends a custom domain for production public bucket access and caching.

If there is a reason to keep the bucket private, route it through a Worker with an R2 binding instead. For public podcast enclosures, a public custom domain is likely the simpler approach.

Set sensible content types and long cache headers for immutable episode media.

Example:

```text
Content-Type: audio/mpeg
Cache-Control: public, max-age=31536000, immutable
```

Do not overwrite a published audio object at the same URL if possible. Version or replace it under a new object key.

---

# 15. First-party podcast RSS feed

Generate an RSS feed from the episode collection.

Route:

```text
/rss.xml
```

Use Astro's RSS support or explicitly generate XML if podcast namespace control makes that preferable.

Include at minimum:

- show title
- site URL
- show description
- language
- artwork
- author/owners as required
- episode title
- episode description
- publication date
- GUID
- audio enclosure URL
- audio MIME type
- audio byte length
- duration
- explicit-content declaration as appropriate
- episode number where supported

Also support common podcast namespaces/metadata expected by Apple and other podcast clients.

RSS must be validated as part of release testing.

Add a visible:

```text
Copy RSS Feed
```

control on the Listen page.

The RSS URL should be stable permanently.

---

# 16. Daily Mirror page

Route:

```text
/daily-mirror/
```

This is a core interactive feature.

The page should reveal:

1. Tarot card
2. Upright or reversed state
3. Chakra
4. Colour
5. Number

It should feel like drawing something from the mirror rather than pressing five unrelated random buttons.

Suggested flow:

```text
"Look Into The Mirror"
        ↓
"Reveal Today's Mirror"
        ↓
animated/revealed result
```

Animation must be restrained and respect:

```css
@media (prefers-reduced-motion: reduce)
```

## Daily consistency

Prefer a deterministic daily result, rather than a new result every page refresh.

Use a date-based seed, ideally based on the site's configured timezone:

```text
Australia/Adelaide
```

Then derive tarot/chakra/number/colour independently from the date seed.

This means everyone sees the same "daily" draw for that site date.

If instead the desired behaviour is a new random draw per visitor, make that a configuration option. Do not silently choose one behaviour.

Suggested config:

```ts
export const dailyMirrorConfig = {
  timezone: "Australia/Adelaide",
  mode: "daily", // "daily" | "session" | "random"
} as const;
```

---

# 17. Tarot data

Expected source file:

```text
src/data/tarot/cards.json
```

Expected images:

```text
public/images/tarot/
```

Do not rename source image files silently. Build a clear mapping between JSON card ID and image path.

Use a schema compatible with data such as:

```json
{
  "name": "The Fool",
  "arcana": "Major",
  "suit": null,
  "number": "0",
  "element": "Air",
  "astrology": "Uranus",
  "keywords_upright": [
    "beginnings",
    "spontaneity",
    "innocence",
    "leap of faith"
  ],
  "keywords_reversed": [
    "recklessness",
    "naivety",
    "hesitation",
    "poor judgment"
  ],
  "meaning_upright": "A new journey or phase begins...",
  "meaning_reversed": "A warning against rash actions...",
  "symbolism": "Cliff edge...",
  "description": "...",
  "numerology": {
    "number": 0,
    "root": 0
  },
  "hebrew_letter": "Aleph (א)",
  "archetype": "The Innocent / Beginner",
  "elemental_dignities": {
    "element": "Air",
    "friendly": null,
    "opposing": null
  },
  "colours": null,
  "animals": null,
  "direction": null,
  "yes_no": "Maybe",
  "timing": {
    "season": null
  },
  "planet": "Uranus",
  "zodiac_sign": null,
  "metal": "Aluminum",
  "planet_day": "Saturday",
  "planet_symbol": "♅",
  "associated_gemstones": [
    "Labradorite",
    "Fluorite",
    "Hematite"
  ],
  "associated_herbs": [
    "Aloe",
    "Mullein"
  ],
  "associated_incense": [
    "Mugwort"
  ],
  "playing_card": null,
  "notes_extended": "...",
  "meanings_contextual": {
    "career": "...",
    "love": "...",
    "finance": "...",
    "health": "..."
  },
  "reflective_questions": [
    "What's the most honest next step?"
  ],
  "affirmation": "I align thought, heart, and action with my highest good.",
  "chakra": null
}
```

The actual schema should tolerate genuinely optional/null fields.

---

# 18. Upright and reversed tarot behaviour

The card state should be selected independently with approximately a 50/50 choice unless configured otherwise.

Example model:

```ts
type TarotOrientation = "upright" | "reversed";
```

When reversed:

```css
.tarot-card[data-orientation="reversed"] img {
  transform: rotate(180deg);
}
```

Do **not** rotate the surrounding text/UI.

Use the matching fields:

```ts
const keywords =
  orientation === "upright"
    ? card.keywords_upright
    : card.keywords_reversed;

const meaning =
  orientation === "upright"
    ? card.meaning_upright
    : card.meaning_reversed;
```

Show a clear label:

```text
UPRIGHT
```

or:

```text
REVERSED
```

Do not imply that reversed necessarily means "bad". Present the source data as supplied.

---

# 19. Tarot result information hierarchy

Do not dump the entire JSON object onto the screen.

## Always show

- card name
- card image
- upright/reversed state
- arcana
- number
- suit, when applicable
- element
- main meaning for selected orientation
- selected orientation keywords
- archetype
- affirmation
- reflective question(s)
- linked chakra, once present in the source data

## Show in expandable "Explore the card" section

Where present:

- symbolism
- astrology / planet
- zodiac sign
- Hebrew letter
- numerology
- gemstones
- herbs
- incense
- colours
- animal associations
- timing
- yes/no
- metal
- planetary symbol/day
- contextual meanings:
  - career
  - love
  - finance
  - health

This keeps the main result usable while preserving the depth of the dataset.

---

# 20. Chakra data

Expected:

```text
src/data/chakras/chakras.json
public/images/chakras/
```

Ask me for:

- the chakra JSON
- source image files
- exact image-to-record mapping
- whether the tarot card's `chakra` field is a single value or multiple associations

Suggested shape:

```json
{
  "id": "heart",
  "name": "Heart Chakra",
  "sanskrit": "Anahata",
  "colour": "#...",
  "image": "/images/chakras/heart.png",
  "location": "...",
  "themes": [],
  "balanced": [],
  "imbalanced": [],
  "affirmation": ""
}
```

Do not fabricate missing metaphysical associations. Render the supplied dataset.

---

# 21. Daily colour

Use a curated source file rather than generating arbitrary RGB colours.

Suggested:

```text
src/data/colours.json
```

Example:

```json
[
  {
    "id": "gold",
    "name": "Gold",
    "hex": "#A98853",
    "meaning": "..."
  }
]
```

The selected colour should be visually shown but still print its name and hex value so it does not depend on colour perception alone.

---

# 22. Daily number

Define the intended range before implementation.

Default recommendation:

```text
1–99
```

unless our numerology content is intended to constrain this to `1–9`, `0–9`, master numbers, or another defined set.

**Ask me which number system to use before locking this in.**

If number meanings will exist, use a JSON source:

```text
src/data/numerology.json
```

and render its supplied interpretation.

---

# 23. Daily Astrology page

Route:

```text
/astrology/
```

Important requirement:

> The page must derive its astrology content only from the Sisters with Mirrors daily astrology JSON source. It must not call a third-party astrology API and must not invent missing values.

Preferred runtime source:

```text
/public/data/astrology/daily.json
```

which is served from:

```text
https://sisterswithmirrors.com/data/astrology/daily.json
```

The page should fetch the JSON from the same origin at runtime.

This lets the daily astrology JSON be independently replaced/deployed while keeping a simple and auditable source.

If JSON updates are committed to Git, a site deployment can update it. If astrology data later needs to be updated without rebuilding the full site, move this single data source to R2 or a Worker endpoint while preserving the same JSON contract.

## Do not fall back to external data

If the file is:

- missing
- invalid
- stale
- has the wrong date

show a graceful message such as:

```text
Today's astrology update is not available yet.
```

Do not substitute generic astrology generated in the browser.

---

# 24. Daily astrology JSON contract

The exact final JSON will be supplied later.

Create:

```text
src/schemas/astrology.ts
```

and validate the response before rendering.

A proposed initial structure might be:

```json
{
  "date": "2026-09-10",
  "timezone": "Australia/Adelaide",
  "summary": "",
  "cosmicTheme": "",
  "moon": {
    "sign": "",
    "phase": "",
    "illumination": null,
    "image": null
  },
  "sun": {
    "sign": "",
    "image": null
  },
  "transits": [],
  "signs": {
    "aries": {},
    "taurus": {},
    "gemini": {},
    "cancer": {},
    "leo": {},
    "virgo": {},
    "libra": {},
    "scorpio": {},
    "sagittarius": {},
    "capricorn": {},
    "aquarius": {},
    "pisces": {}
  }
}
```

This is a placeholder only.

**Ask me for the actual daily astrology JSON before finalising this page.**

---

# 25. Astrology images

Expected path:

```text
public/images/astrology/
```

Potential organisation:

```text
public/images/astrology/
  zodiac/
  planets/
  moon/
  aspects/
```

Use our supplied artwork.

Do not silently fetch horoscope, zodiac or planetary images from third-party services.

---

# 26. Components

Create reusable Astro components approximately like:

```text
src/components/
  layout/
    Header.astro
    Footer.astro
    PageShell.astro

  episodes/
    EpisodeCard.astro
    EpisodeHero.astro
    EpisodePlatformLinks.astro
    EpisodeAudioPlayer.astro
    CategoryBadge.astro

  daily/
    DailyMirror.astro
    TarotCard.astro
    ChakraCard.astro
    ColourCard.astro
    NumberCard.astro

  astrology/
    AstrologySummary.astro
    ZodiacCard.astro
    TransitList.astro

  hosts/
    HostCard.astro
    HostProfile.astro

  common/
    SocialIcon.astro
    ShareButtons.astro
    SectionHeading.astro
```

Keep components semantic and avoid creating tiny components for every `<div>`.

---

# 27. Audio player

Each episode page should have a first-party HTML5 audio player linked directly to the R2 MP3.

Basic implementation is acceptable:

```html
<audio controls preload="metadata">
  <source src="..." type="audio/mpeg" />
</audio>
```

Style the surrounding UI but do not build a complex custom audio engine unless needed.

Requirements:

- proper title
- play/pause accessible via browser controls
- no autoplay
- no audio on page load
- direct "Download / open audio" link if we choose to offer it

---

# 28. SEO and discoverability

Each episode must generate:

- unique `<title>`
- meta description
- canonical URL
- Open Graph metadata
- social image
- article publication date
- appropriate structured data

Use structured data where applicable:

- `PodcastSeries`
- `PodcastEpisode`
- `Person`
- `Article` / `BlogPosting`
- `BreadcrumbList`

Generate:

```text
/sitemap-index.xml or /sitemap.xml
/robots.txt
/rss.xml
```

Use clean canonical URLs.

Do not put `#` fragments into canonical URLs.

---

# 29. Sharing

Episode pages should offer simple share/copy controls:

- Copy link
- optional Bluesky
- optional X
- optional Facebook

Use Web Share API on supported devices if useful:

```ts
navigator.share(...)
```

with a copy-link fallback.

Avoid loading invasive third-party sharing scripts.

---

# 30. Accessibility

Minimum target:

- semantic landmarks
- keyboard-accessible navigation
- visible focus states
- adequate text contrast
- alt text for meaningful images
- decorative celestial imagery marked appropriately
- reduced-motion support
- no content encoded only by colour
- labels for icon-only buttons
- logical heading hierarchy

Tarot reversal must be stated in text and not represented solely by image rotation.

---

# 31. Responsive layout

Required breakpoints should follow content needs rather than a framework's defaults.

Target behaviours:

## Large desktop

- max content width around 1200–1300px
- article reading column narrower than full page
- 3-card episode grids where appropriate

## Tablet

- 2-column card layouts
- hero rearranges without tiny text

## Mobile

- single column
- platform icons wrap
- interactive Daily Mirror cards fit viewport
- tarot art never causes horizontal overflow
- navigation collapses
- body copy remains comfortably readable

Test at minimum:

```text
375px
430px
768px
1024px
1440px
```

---

# 32. Project structure

Recommended:

```text
.
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── deploy.yml
├── design/
│   └── reference/
│       └── swm-2-speaker-default.png
├── docs/
│   ├── content-authoring.md
│   ├── podcast-distribution.md
│   └── deployment.md
├── public/
│   ├── data/
│   │   └── astrology/
│   │       └── daily.json
│   ├── images/
│   │   ├── astrology/
│   │   ├── chakras/
│   │   ├── episodes/
│   │   ├── hosts/
│   │   └── tarot/
│   ├── favicon.svg
│   └── robots.txt
├── scripts/
│   ├── new-episode.mjs
│   └── validate-content.mjs
├── src/
│   ├── components/
│   ├── config/
│   │   ├── site.ts
│   │   ├── platforms.ts
│   │   └── categories.ts
│   ├── content/
│   │   └── episodes/
│   ├── data/
│   │   ├── hosts.json
│   │   ├── tarot/
│   │   │   └── cards.json
│   │   ├── chakras/
│   │   │   └── chakras.json
│   │   ├── colours.json
│   │   └── numerology.json
│   ├── layouts/
│   ├── pages/
│   ├── schemas/
│   ├── styles/
│   │   ├── global.css
│   │   └── tokens.css
│   └── utils/
├── astro.config.mjs
├── package.json
├── tsconfig.json
└── wrangler.jsonc
```

---

# 33. Configuration

Central site config:

```ts
export const site = {
  name: "Sisters with Mirrors",
  tagline: "Look Into The Mirror",
  url: "https://sisterswithmirrors.com",
  mediaUrl: "https://media.sisterswithmirrors.com",
  language: "en-AU",
  timezone: "Australia/Adelaide",
} as const;
```

Do not scatter these values around templates.

---

# 34. Cloudflare environments

Use two Cloudflare Worker environments:

```text
production
development
```

Suggested Worker names:

```text
sisters-with-mirrors
sisters-with-mirrors-dev
```

Suggested domains:

```text
Production:
https://sisterswithmirrors.com

Development:
https://dev.sisterswithmirrors.com
```

The exact domains must be confirmed with me before configuring routes.

Wrangler environments can represent environment-specific Worker configuration. Keep production and development bindings/domains clearly separated.

---

# 35. Git strategy

Expected flow:

```text
feature branch
      ↓
     dev
      ↓
automatic dev deployment
      ↓
review at dev.sisterswithmirrors.com
      ↓
pull request: dev → main
      ↓
CI
      ↓
merge
      ↓
automatic production deployment
```

Do not deploy production from arbitrary branches.

Recommended branch protection:

## `main`

- pull request required
- CI required
- no direct pushes where practical

## `dev`

- CI required
- may accept feature branches
- automatically deploy after a successful push

---

# 36. GitHub Actions

Create a normal CI workflow for pull requests and branch pushes.

Conceptually:

```yaml
name: CI

on:
  pull_request:
  push:
    branches:
      - dev
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm run check
      - run: npm run validate:content
      - run: npm run build
```

Use current supported action versions when implementation occurs.

Deployment should occur only after validation succeeds.

The Cloudflare deployment workflow will require GitHub secrets such as:

```text
CLOUDFLARE_API_TOKEN
CLOUDFLARE_ACCOUNT_ID
```

Do not commit these.

Cloudflare's documented GitHub Actions/Wrangler deployment flow uses an API token and account ID for non-interactive CI.

---

# 37. Deployment behaviour

On push to:

```text
dev
```

run:

```text
npm ci
npm run check
npm run validate:content
npm run build
npx wrangler deploy --env development
```

On push/merge to:

```text
main
```

run:

```text
npm ci
npm run check
npm run validate:content
npm run build
npx wrangler deploy
```

The exact Wrangler configuration and command should be aligned with the final Astro Cloudflare setup rather than blindly copying these examples.

---

# 38. Content draft behaviour

Frontmatter:

```yaml
draft: true
```

Production must not publish drafts.

Development may optionally show drafts with a visible `DRAFT` badge.

Recommended:

```text
dev environment → show drafts
production → exclude drafts
```

This makes `dev` useful as an editorial preview.

---

# 39. Article images

Use local/site-controlled images.

Prefer:

- AVIF where practical
- WebP
- optimized JPEG/PNG where required

Use Astro's image tools for site-bundled assets where they fit.

Do not resize tarot artwork in a way that damages card detail.

For episode artwork, generate consistent social images if possible.

---

# 40. Analytics

Do not add invasive analytics by default.

If analytics are wanted, prefer Cloudflare Web Analytics or another privacy-conscious option.

Keep analytics implementation isolated so it can be disabled.

Ask me before enabling analytics or tracking cookies.

---

# 41. Security and privacy

This is initially a public content site.

Requirements:

- no secrets in client-side JavaScript
- no R2 write credentials in the browser
- no arbitrary HTML execution from untrusted JSON
- validate data
- sanitize any intentionally rendered HTML
- external links opened in new tabs should use safe `rel` attributes where appropriate
- dependencies kept minimal
- no third-party astrology API keys
- no unnecessary database

The site does **not** need a CMS/database to begin with.

Git + Markdown is the editorial source of truth.

---

# 42. Authoring documentation

Create:

```text
docs/content-authoring.md
```

It should explain, in short practical steps:

## New weekly episode

```bash
git checkout dev
git pull
npm run new:episode
```

Then:

1. edit generated Markdown
2. add episode artwork
3. add R2 audio URL
4. add platform URLs
5. preview:

```bash
npm run dev
```

6. commit and push to `dev`
7. verify development deployment
8. open PR from `dev` to `main`
9. merge when satisfied

The guide should include a complete example post.

---

# 43. Development commands

Expected package scripts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "new:episode": "node scripts/new-episode.mjs",
    "validate:content": "node scripts/validate-content.mjs"
  }
}
```

Add formatter/lint scripts if adopted, but keep the toolchain lean.

---

# 44. Testing

At minimum verify:

- site builds
- content schemas validate
- RSS generation succeeds
- no duplicate slugs
- daily tarot selection is stable for a date in `daily` mode
- tarot reversal selects reversed text and rotates only the image
- Daily Astrology rejects malformed JSON
- Daily Astrology handles missing/stale file safely
- platform links with null/empty URLs are not rendered
- drafts excluded from production
- important routes return successfully

Browser/e2e tests can be added for key interactive paths if worthwhile.

---

# 45. Daily Mirror deterministic algorithm

Put selection logic in a testable utility, not inline in a component.

For example:

```ts
export function hashString(value: string): number {
  let hash = 2166136261;

  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

export function pickDaily<T>(
  items: readonly T[],
  dateKey: string,
  namespace: string,
): T {
  if (items.length === 0) {
    throw new Error(`Cannot choose from empty ${namespace} collection.`);
  }

  const index = hashString(`${dateKey}:${namespace}`) % items.length;
  return items[index];
}
```

Use separate namespaces:

```text
tarot-card
tarot-orientation
chakra
colour
number
```

so the selections are not coupled.

The displayed date must be derived using the configured timezone, not blindly from UTC.

---

# 46. Progressive enhancement

The blog, episode pages, About pages and RSS must work without JavaScript.

JavaScript can enhance:

- Daily Mirror reveal
- Daily Astrology runtime fetch
- sharing
- copy RSS link
- optional filters/search

Do not turn the whole site into an SPA.

---

# 47. Search

Do not add a hosted search provider initially.

If search is useful, build a lightweight client-side article index generated at build time.

Search fields:

- title
- excerpt
- categories
- tags
- episode number

This is optional for the initial build.

---

# 48. Design details to carry over from the video artwork

Use the supplied image as a reference for:

- very dark cosmic backdrop
- dusty plum/purple clouds
- muted gold outlines
- thin rectangular frames
- centered celestial details
- star/constellation line work
- ivory/gold serif display text
- small uppercase labels

Potential site translation:

```text
Video frame border → episode card border
Central celestial divider → section ornament
Bottom tarot/colour/number/cosmic bar → Daily Mirror preview
Title lock-up → header/hero identity
Gold star motifs → separators and focus accents
```

Do not literally recreate the two green speaker rectangles on the website.

---

# 49. Initial assets/information Codex must request from me

Before final visual/content completion, stop and ask me for any missing items from this list rather than inventing them:

1. **Video-layout reference image**
   - `swm-2-speaker-default.png`

2. **Brand/logo assets**
   - SVG/PNG logo if one exists
   - any celestial/ornamental artwork already owned

3. **DJ**
   - profile image
   - short bio
   - full bio
   - any social/profile links

4. **Warren**
   - profile image
   - short bio
   - full bio
   - any social/profile links

5. **Tarot**
   - complete `cards.json`
   - all tarot image files
   - exact image naming/mapping
   - final `chakra` association field structure

6. **Chakras**
   - chakra JSON
   - chakra image files

7. **Colours**
   - curated colour dataset, if meanings are intended

8. **Numbers**
   - desired range/system
   - numerology meanings JSON if applicable

9. **Astrology**
   - exact `daily.json` schema/example
   - zodiac images
   - planet images
   - moon/aspect images if applicable

10. **Podcast**
    - production RSS show description
    - author/owner metadata
    - show artwork
    - explicit-content setting
    - contact email used in podcast metadata where required

11. **Platform URLs**
    - Spotify show URL
    - YouTube channel/podcast URL
    - Apple Podcasts URL
    - Amazon Music/Audible URL
    - iHeartRadio URL
    - others once registered

12. **Cloudflare**
    - confirm production domain
    - confirm dev domain
    - confirm R2 media hostname
    - R2 bucket name
    - Worker names

Never ask for Cloudflare API secrets in chat or commit them to source. Tell me which GitHub Secret names to create.

---

# 50. Build phases

Codex should implement this in phases rather than trying to fake missing data.

## Phase 1 — Skeleton and visual system

Build:

- Astro project
- CSS tokens
- header/footer
- responsive shell
- homepage
- episode content collection
- episode listing/detail
- category pages
- host page placeholders
- Listen page
- RSS route
- example fixture content
- CI

Use clearly marked fixture content only where needed.

## Phase 2 — Deployment

Build:

- Wrangler configuration
- development Worker environment
- production Worker
- GitHub Actions deployments
- `dev` branch deployment
- `main` deployment
- deployment documentation

## Phase 3 — Real podcast content

After I provide assets:

- host profiles
- real episode artwork/content
- real platform URLs
- R2 audio links
- production RSS metadata

## Phase 4 — Daily Mirror

After datasets are supplied:

- tarot
- reversed/upright selection
- chakra
- number
- colour
- reveal UI
- deterministic daily logic
- tests

## Phase 5 — Daily Astrology

After exact JSON contract and images are supplied:

- runtime JSON fetch
- validation
- date/staleness handling
- astrology visualisation
- zodiac/transit sections

## Phase 6 — Finish

- accessibility audit
- responsive testing
- SEO metadata
- structured data
- RSS validation
- image optimisation
- performance check
- cleanup fixture data
- documentation

---

# 51. Definition of done

The initial site is complete when:

- `dev` automatically publishes to the development Worker/site.
- `main` automatically publishes to production.
- a PR from `dev` to `main` is the normal release path.
- a new article can be created quickly in Markdown.
- the episode page automatically renders its listening/watching links from frontmatter.
- categories work.
- host pages work.
- responsive layout works on mobile/tablet/desktop.
- podcast RSS is public and validates.
- R2 MP3 URLs are used as podcast enclosures.
- Daily Mirror consumes only our bundled/source JSON.
- reversed tarot cards rotate exactly 180° and use reversed meanings.
- Daily Astrology consumes only our designated daily JSON.
- missing astrology data fails gracefully.
- no third-party astrology content is silently introduced.
- site styling clearly belongs to Sisters with Mirrors.
- content and platform configuration is documented.
- there are no secrets committed to Git.

---

# 52. Codex operating instructions

When implementing this specification:

1. Inspect the existing repository before changing architecture.
2. Preserve useful existing files and conventions.
3. Do not guess at data/assets I have explicitly said I will supply.
4. Ask me for the next missing asset/data set **at the point it is actually required**.
5. Do not block the entire build because Phase 4/5 data is not ready.
6. Use typed schemas around all content/data contracts.
7. Keep JavaScript shipped to the browser small.
8. Prefer static Astro output/components where possible.
9. Do not introduce React/Vue/Svelte merely for simple interactivity.
10. Keep the site's visual identity restrained and consistent.
11. Give me exact file paths whenever asking me to place an asset.
12. Give me exact JSON paths and schemas whenever asking me for data.
13. When Cloudflare credentials are required, tell me the GitHub Secret/configuration name; do not ask me to paste a secret into source.
14. Before production deployment, show me the final Worker/domain/R2 configuration that will be used.
15. Build incrementally and keep the project runnable after each phase.

---

# 53. Recommended first Codex task

Start with this:

> Read this specification in full. Inspect the repository. Produce a short implementation plan mapped to Phases 1–6. Then implement Phase 1 only. Use the supplied `design/reference/swm-2-speaker-default.png` as the visual reference. If that file is missing, ask me to provide it. Do not invent host biographies, tarot/chakra datasets, astrology data, podcast directory URLs, or Cloudflare credentials. When Phase 1 builds cleanly, show me the resulting file structure, commands to run it locally, and exactly which assets/data you need from me for the next phase.

---

# 54. Notes on architecture choices

The deliberate choices in this specification are:

- **Astro** because the site is primarily content and can ship very little JavaScript.
- **Markdown Content Collections** because adding a weekly article should be a file operation, not a CMS project.
- **No Tailwind initially** because a small bespoke design system better fits the restrained visual identity and avoids unnecessary class-heavy markup.
- **Cloudflare Workers** because it supports the intended deployment platform and allows future Worker/R2 integration without changing hosts.
- **R2 custom domain** for production media so podcast audio has stable, first-party URLs and can benefit from Cloudflare caching.
- **GitHub Actions** so branch-to-environment behaviour is explicit and reviewable.
- **Daily Mirror as deterministic data-driven logic** so a "card of the day" actually remains the card of the day rather than changing on refresh.
- **Astrology as an owned JSON contract** so the site never becomes dependent on a third-party horoscope/astrology API.
- **No database/CMS initially** because Git + Markdown + JSON already provides the required publishing workflow with fewer moving parts.
