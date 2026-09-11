# Sisters with Mirrors Phase 1 Foundation Design

## Scope

Phase 1 establishes a mostly static Astro publication for Sisters with Mirrors. It includes the responsive site shell, bespoke visual system, episode publishing workflow, episode and category routes, host placeholders, Listen page, podcast RSS route, content validation, fixture content, and CI. Cloudflare deployment, real podcast distribution data, Daily Mirror functionality, and Daily Astrology functionality remain outside this phase.

## Architecture

The site uses Astro with strict TypeScript and static output. Astro components render semantic HTML with little or no client-side JavaScript. Markdown files in an Astro Content Collection are the editorial source of truth for weekly episodes, while central typed configuration modules provide stable site, category, and podcast-platform data.

Phase 1 does not add the Cloudflare adapter or Wrangler configuration. Those belong to Phase 2, when Worker names, domains, and R2 configuration can be confirmed without coupling the initial site implementation to guessed deployment values.

## Visual System

The supplied `design/reference/swm-2-speaker-default.png` is the visual reference. The website translates its near-black celestial field, smoky plum atmosphere, high-contrast serif typography, thin gold framing, ivory copy, and precise moon/star/orbit ornament into an editorial web layout.

The core colour tokens are:

- primary gold: `#A98853`
- secondary ivory: `#D7CCB8`
- dark near-black backgrounds
- restrained plum and purple atmospheric accents

The interface avoids chroma green, neon styling, glassmorphism, oversized rounded cards, generic occult-template imagery, and SaaS conventions. Decorative celestial elements use lightweight CSS and accessible inline SVG. Decorative graphics are hidden from assistive technology.

Typography uses an elegant open-source display serif and a readable sans-serif fallback stack. The implementation must not depend on developer-machine font paths. Layouts scale by content need for mobile, tablet, and desktop, with visible focus states and reduced-motion support.

## Pages and Navigation

The primary navigation contains the brand link, Episodes, Daily Mirror, Daily Astrology, About, and Listen. Phase 1 provides active pages for the homepage, episodes, categories, host placeholders, and Listen. Links to later-phase Daily Mirror, Daily Astrology, and About routes remain visible only if matching placeholder pages are intentionally included; navigation must not lead to missing routes.

The mobile navigation uses semantic controls, supports keyboard operation, exposes its state to assistive technology, and requires only small progressive-enhancement JavaScript.

The homepage presents the podcast identity, the latest publishable episode, recent episodes, restrained previews of future mirror features, host placeholders, and configured listening destinations. Episode metadata supplies all available watch/listen actions.

Episode routes include:

- `/episodes/` for the reverse-chronological listing
- `/episodes/[slug]/` for Markdown-rendered detail pages
- `/categories/` for the controlled category index
- `/categories/[category]/` for category-filtered episode listings

Host routes include `/hosts/`, `/hosts/dj/`, and `/hosts/warren/`. They identify the hosts but clearly state that biographies and images await supplied content.

The Listen page displays only centrally configured show-level platform URLs. It exposes the permanent `/rss.xml` address and a progressive-enhancement copy control with a normal link fallback.

## Episode Content Contract

Episodes live under `src/content/episodes/` as Markdown. The Content Collection schema validates:

- title and stable slug
- positive episode number
- publication and optional update dates
- draft state
- excerpt and description
- one or more controlled categories
- free-form tags
- optional local artwork and required alt text when artwork is present
- optional duration
- optional audio URL, MIME type, and positive byte count
- optional self-hosted, YouTube, and Spotify episode links
- optional podcast-directory episode links
- optional transcript
- known host identifiers
- canonical and no-index controls

Platform and audio URLs are optional because Phase 1 must build before real distribution data exists. Page components render only populated values. Authors never recreate platform buttons in Markdown.

Production page queries exclude drafts. The initial fixture is published so all routes have representative content, but it is visibly labelled as fixture content and contains no invented external platform or audio URLs.

## RSS Behaviour

`/rss.xml` is generated from non-draft episode content. The channel uses central site metadata and emits podcast-compatible namespaces and fields available without inventing owner, explicit-content, artwork, or directory data.

An item is included only when it has a complete enclosure: audio URL, MIME type, and positive byte length. The fixture episode therefore demonstrates page rendering but is omitted from the feed until real audio metadata is supplied. The feed remains valid with zero items.

Missing production podcast metadata is documented explicitly for Phase 2 or Phase 3 rather than replaced with fabricated values.

## Authoring Workflow

`npm run new:episode` prompts for episode number, title, publication date, description, categories, R2 audio URL, YouTube URL, Spotify URL, and hero image. It validates controlled categories, derives a predictable filename and slug, refuses collisions, and writes complete frontmatter plus starter article headings. Optional unanswered URLs remain empty or null in schema-compatible form.

`docs/content-authoring.md` documents generation, editing, artwork placement, validation, local preview, and the intended branch workflow. `docs/podcast-distribution.md` records each target platform with empty show URLs and unsubmitted status.

## Validation and Testing

`npm run check` performs Astro and TypeScript checking. `npm run validate:content` independently checks content and local data for:

- invalid or incomplete frontmatter
- unknown categories or hosts
- duplicate slugs
- duplicate episode numbers
- malformed JSON under owned data paths
- missing local assets referenced by episode or host data
- invalid combinations such as artwork without alt text or incomplete audio enclosures

Automated tests cover the custom validation and authoring utilities where behaviour is not already exercised by Astro. The implementation follows test-first cycles for executable logic.

CI runs on pull requests and pushes to `dev` and `main` using Node 22. It installs from the lockfile, runs tests, Astro checks, content validation, and the production build. It does not deploy.

## Accessibility and Progressive Enhancement

All pages use semantic landmarks, logical heading structure, keyboard-accessible controls, adequate contrast, meaningful alternative text, and visible focus treatment. Decorative celestial details do not add screen-reader noise. Motion is restrained and disabled when reduced motion is requested.

Episode reading, navigation links, category browsing, host pages, Listen content, and RSS work without client JavaScript. JavaScript is limited to enhancements such as mobile navigation and copying the RSS URL.

## Fixture and Placeholder Boundaries

Phase 1 may create:

- one explicitly labelled fixture episode
- one abstract, locally controlled fixture episode artwork asset
- empty platform configuration entries
- host records containing only supplied names and roles
- visible host biography/image placeholders
- future-feature preview copy that makes no tarot, chakra, numerology, or astrology claims

Phase 1 must not invent host biographies or images, metaphysical datasets, podcast platform URLs, production podcast owner metadata, Cloudflare credentials, Worker names, domains, R2 bucket values, or deployment configuration.

## Phase Boundary

Phase 1 ends after fresh successful runs of the automated tests, Astro/TypeScript checks, content validation, and production build, plus a local-server smoke check of important routes. The final handoff lists the relevant file tree, commands, fixture content, and exact inputs required for Phase 2. No deployment occurs, and no Phase 2 implementation begins without approval.
