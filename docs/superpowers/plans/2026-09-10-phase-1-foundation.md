# Sisters with Mirrors Phase 1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build and verify the Phase 1 static Astro website, episode publishing system, podcast RSS route, validation tools, documentation, and CI without inventing later-phase data or deployment configuration.

**Architecture:** Astro renders semantic, mostly static pages from a typed Markdown episode collection and small central configuration modules. Native CSS and focused Astro components express the supplied celestial visual identity; Node scripts share pure utilities for authoring and validation, and CI proves the same checks used locally.

**Tech Stack:** Astro, TypeScript, Astro Content Collections, Zod through Astro's content API, native CSS, Node.js 22 built-in test runner with `tsx` for TypeScript imports, YAML parser for independent frontmatter validation, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-10-phase-1-foundation-design.md`

## Global Constraints

- Implement Phase 1 only; do not add Wrangler, a Cloudflare adapter, deployment jobs, domains, credentials, Worker names, or R2 configuration.
- Use primary gold `#A98853`, secondary ivory `#D7CCB8`, near-black backgrounds, and restrained plum atmosphere derived from `design/reference/swm-2-speaker-default.png`.
- Do not use Tailwind, React, Vue, Svelte, a CMS, a database, or third-party astrology services.
- Do not invent host biographies or images, metaphysical datasets, podcast platform URLs, podcast owner metadata, or Cloudflare values.
- Keep episode platform buttons and RSS data driven by frontmatter rather than Markdown body links.
- Mark all non-production episode data and artwork visibly as fixture content.
- Keep unrelated files outside `wwwroot/` untouched and stage only Phase 1 files.
- Follow test-first red-green-refactor cycles for executable TypeScript and JavaScript behaviour.

---

## File Responsibility Map

### Project and tooling

- `package.json`: dependency and command contract.
- `package-lock.json`: reproducible dependency resolution.
- `astro.config.mjs`: static Astro site URL and trailing-slash policy.
- `tsconfig.json`: strict Astro TypeScript configuration.
- `.gitignore`: generated output and local environment exclusions within `wwwroot`.
- `.github/workflows/ci.yml`: non-deployment validation for pull requests and `dev`/`main` pushes.

### Content contracts and configuration

- `src/content.config.ts`: Astro episode loader and Zod schema.
- `src/config/site.ts`: canonical site identity, locale, timezone, and RSS path.
- `src/config/categories.ts`: stable category keys, labels, and guards.
- `src/config/platforms.ts`: show-level podcast platform entries, empty unless supplied.
- `src/data/hosts.json`: DJ and Warren names/roles with deliberately empty supplied-content fields.
- `src/types/episode.ts`: inferred reusable episode metadata types where component props need them.

### Shared content utilities

- `src/utils/episodes.ts`: production draft filtering, chronological sorting, category filtering, and route data helpers.
- `src/utils/links.ts`: populated-platform filtering and safe external-link classification.
- `src/utils/rss.ts`: complete-enclosure predicate and RSS-safe episode mapping.

### Layout and presentation

- `src/styles/tokens.css`: colour, typography, spacing, border, radius, and width tokens.
- `src/styles/global.css`: reset, atmosphere, global typography, utilities, focus, responsive defaults, and reduced motion.
- `src/layouts/BaseLayout.astro`: document metadata, canonical URL, header/footer, and main landmark.
- `src/layouts/EpisodeLayout.astro`: narrow editorial article shell and episode metadata.
- `src/components/layout/Header.astro`: desktop and progressive-enhancement mobile navigation.
- `src/components/layout/Footer.astro`: host, episode, configured platform, and RSS links.
- `src/components/common/CelestialMark.astro`: accessible-hidden ornament variants.
- `src/components/common/SectionHeading.astro`: consistent editorial section heading.
- `src/components/episodes/CategoryBadge.astro`: controlled category link.
- `src/components/episodes/EpisodeCard.astro`: listing summary.
- `src/components/episodes/EpisodePlatformLinks.astro`: metadata-driven episode actions.
- `src/components/episodes/EpisodeAudioPlayer.astro`: optional native HTML audio UI.
- `src/components/episodes/EpisodeHero.astro`: featured episode presentation.
- `src/components/hosts/HostCard.astro`: factual placeholder host presentation.

### Routes and public assets

- `src/pages/index.astro`: homepage.
- `src/pages/episodes/index.astro`: episode listing.
- `src/pages/episodes/[slug].astro`: static episode detail routes.
- `src/pages/categories/index.astro`: controlled category directory.
- `src/pages/categories/[category].astro`: category episode routes.
- `src/pages/hosts/index.astro`, `dj.astro`, `warren.astro`: host placeholders.
- `src/pages/listen/index.astro`: configured platforms, RSS link, and copy enhancement.
- `src/pages/daily-mirror/index.astro`, `src/pages/astrology/index.astro`, `src/pages/about/index.astro`: explicit future-phase placeholders so primary navigation never dead-ends.
- `src/pages/rss.xml.ts`: stable first-party podcast feed.
- `src/pages/404.astro`: styled not-found page.
- `public/images/episodes/fixture-episode-artwork.svg`: abstract labelled fixture art.
- `public/favicon.svg`: project-owned celestial favicon.
- `public/robots.txt`: crawler defaults and sitemap hint.

### Authoring and validation

- `scripts/lib/episode-authoring.mjs`: slugging, filename, category parsing, and Markdown generation.
- `scripts/new-episode.mjs`: readline prompt adapter and safe file write.
- `scripts/lib/content-validation.mjs`: discover, parse, and validate Markdown/JSON/local assets.
- `scripts/validate-content.mjs`: CLI reporter and exit code.
- `tests/episode-authoring.test.mjs`: authoring utility behaviour.
- `tests/content-validation.test.mjs`: duplicate, malformed, required-field, and asset validation behaviour.
- `tests/episode-utils.test.ts`: episode selection and RSS predicates executed through `tsx`.
- `docs/content-authoring.md`: weekly workflow and full fixture-shaped example.
- `docs/podcast-distribution.md`: unconfigured distribution checklist.

---

### Task 1: Establish the Astro and Test Toolchain

**Files:**

- Create: `package.json`
- Create: `package-lock.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `tests/project-contract.test.mjs`

**Interfaces:**

- Produces: npm scripts `dev`, `build`, `preview`, `check`, `test`, `new:episode`, and `validate:content`.
- Produces: Astro static output with canonical site `https://sisterswithmirrors.com`.

- [ ] **Step 1: Write the failing project-contract test**

Create `tests/project-contract.test.mjs` using `node:test`. Read `package.json` and assert every required script exists, `astro` and `@astrojs/check` are dependencies/devDependencies, no forbidden UI framework or Tailwind package is present, and `astro.config.mjs` exists.

- [ ] **Step 2: Run the test and verify the expected failure**

Run: `node --test tests/project-contract.test.mjs`

Expected: FAIL because `package.json` does not exist.

- [ ] **Step 3: Create the minimal project configuration**

Create the package manifest with ESM enabled and these script contracts:

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "test": "node --import tsx --test tests/**/*.test.{mjs,ts}",
    "new:episode": "node scripts/new-episode.mjs",
    "validate:content": "node scripts/validate-content.mjs"
  }
}
```

Install the current compatible stable releases of Astro, `@astrojs/check`, TypeScript, `tsx`, and `yaml`; record exact resolutions in `package-lock.json`. Configure static output, the canonical site URL, strict Astro TypeScript, and local ignores for `node_modules`, `dist`, `.astro`, coverage, and environment files.

- [ ] **Step 4: Run the project-contract test and baseline Astro checks**

Run: `npm test`

Expected: PASS.

Run: `npm run check`

Expected: Astro reports no errors once the minimal source directory and environment declaration required by the installed Astro version are present.

- [ ] **Step 5: Commit the toolchain slice**

```bash
git add wwwroot/package.json wwwroot/package-lock.json wwwroot/astro.config.mjs wwwroot/tsconfig.json wwwroot/.gitignore wwwroot/tests/project-contract.test.mjs
git commit -m "build: initialise Astro phase 1 toolchain"
```

### Task 2: Define Typed Site, Category, Host, and Episode Contracts

**Files:**

- Create: `src/config/site.ts`
- Create: `src/config/categories.ts`
- Create: `src/config/platforms.ts`
- Create: `src/data/hosts.json`
- Create: `src/content.config.ts`
- Create: `src/types/episode.ts`
- Create: `src/utils/episodes.ts`
- Create: `src/utils/links.ts`
- Create: `src/utils/rss.ts`
- Test: `tests/episode-utils.test.ts`

**Interfaces:**

- Produces: `CATEGORY_LABELS`, `CategoryKey`, `isCategoryKey(value)`, `site`, `platforms`, `getPublishedEpisodes(entries)`, `getEpisodesByCategory(entries, category)`, `getConfiguredPlatforms(entries)`, and `hasCompleteEnclosure(data)`.
- Consumes: Astro's `defineCollection`, `z`, and glob loader APIs matching the installed version.

- [ ] **Step 1: Write failing utility contract tests**

Test that category guards accept all controlled keys and reject spelling variants, configured-platform filtering removes empty URLs, published-episode sorting excludes drafts and sorts newest first, category filtering is exact, and enclosure completeness requires URL, MIME type, and a positive integer byte count.

- [ ] **Step 2: Run tests and verify missing-module failures**

Run: `npm test`

Expected: FAIL because the configuration and utility modules do not exist.

- [ ] **Step 3: Implement central contracts and pure helpers**

Create the exact controlled category mapping from the approved specification. Define site values once, with `name`, `tagline`, canonical production URL, language `en-AU`, timezone `Australia/Adelaide`, and `/rss.xml`. Define every requested platform with an empty URL except the local RSS entry.

Create host JSON containing only:

```json
[
  { "id": "dj", "name": "DJ", "role": "Host", "shortBio": "", "bio": "", "image": null, "links": {} },
  { "id": "warren", "name": "Warren", "role": "Co-host", "shortBio": "", "bio": "", "image": null, "links": {} }
]
```

Define the episode collection schema with strict required editorial fields and optional distribution fields. Use refinements for artwork/alt pairing and all-or-none audio enclosure metadata. Export focused helpers without page-specific markup.

- [ ] **Step 4: Run tests and Astro checks**

Run: `npm test && npm run check`

Expected: PASS with no TypeScript or schema errors.

- [ ] **Step 5: Commit the content-contract slice**

```bash
git add wwwroot/src/config wwwroot/src/data/hosts.json wwwroot/src/content.config.ts wwwroot/src/types wwwroot/src/utils wwwroot/tests/episode-utils.test.ts
git commit -m "feat: define typed episode content contracts"
```

### Task 3: Build Independent Content Validation and Episode Generation

**Files:**

- Create: `scripts/lib/episode-authoring.mjs`
- Create: `scripts/new-episode.mjs`
- Create: `scripts/lib/content-validation.mjs`
- Create: `scripts/validate-content.mjs`
- Test: `tests/episode-authoring.test.mjs`
- Test: `tests/content-validation.test.mjs`

**Interfaces:**

- Produces: `slugify(title)`, `parseCategories(input)`, `buildEpisodeFilename(input)`, `renderEpisodeMarkdown(input)`, and `validateContent(rootDirectory)` returning `{ errors: string[], filesChecked: number }`.
- Consumes: controlled category keys and the episode frontmatter shape from Task 2; the `.mjs` implementation imports a small ESM-safe category value module or duplicates only serialized values generated from a single source during validation setup.

- [ ] **Step 1: Write failing authoring tests**

Cover Unicode-safe lowercase slug generation, ampersand/punctuation removal, comma-separated category normalization, rejection of unknown categories, zero-padded episode filenames, YAML-safe quoted values, null optional URLs, complete starter headings, and refusal to overwrite an existing slug.

- [ ] **Step 2: Run authoring tests and verify missing-module failures**

Run: `node --test tests/episode-authoring.test.mjs`

Expected: FAIL because `scripts/lib/episode-authoring.mjs` does not exist.

- [ ] **Step 3: Implement pure authoring functions and prompt adapter**

Keep filesystem writes in `new-episode.mjs`; keep transformation logic pure. Prompt for every field requested in the specification, show valid category keys, require episode/title/date/description/categories, and make URLs/artwork optional. Refuse an existing filename or any existing frontmatter slug before writing.

- [ ] **Step 4: Run authoring tests and verify green**

Run: `node --test tests/episode-authoring.test.mjs`

Expected: PASS.

- [ ] **Step 5: Write failing content-validation tests**

Create temporary fixture directories through `node:fs/promises` and cover valid content, malformed YAML, missing required fields, duplicate slugs, duplicate episode numbers, unknown categories, incomplete audio enclosures, artwork without alt text, missing local assets, valid absolute external assets, malformed host JSON, and missing host image assets when configured.

- [ ] **Step 6: Run validation tests and verify missing behaviour**

Run: `node --test tests/content-validation.test.mjs`

Expected: FAIL because `validateContent` is absent.

- [ ] **Step 7: Implement the validator and CLI**

Parse Markdown frontmatter with explicit delimiters and `yaml`, validate the same required shape and controlled values as the Astro schema, scan all episode files before checking uniqueness, parse every JSON file under `src/data`, and resolve `/...` local asset references beneath `public/` without allowing path traversal. Print every actionable error with its source path and exit non-zero when any exist.

- [ ] **Step 8: Run the focused and full tests**

Run: `npm test`

Expected: PASS.

- [ ] **Step 9: Commit the workflow slice**

```bash
git add wwwroot/scripts wwwroot/tests/episode-authoring.test.mjs wwwroot/tests/content-validation.test.mjs
git commit -m "feat: add episode authoring and content validation"
```

### Task 4: Add Fixture Content and Public Brand Assets

**Files:**

- Create: `src/content/episodes/2026-09-10-fixture-looking-into-the-mirror.md`
- Create: `public/images/episodes/fixture-episode-artwork.svg`
- Create: `public/favicon.svg`
- Create: `public/robots.txt`
- Modify: `tests/content-validation.test.mjs`

**Interfaces:**

- Produces: one non-draft fixture episode using valid categories and hosts, with no external platform URLs and no audio enclosure.
- Consumes: the content schema and validator from Tasks 2–3.

- [ ] **Step 1: Add a failing repository-fixture validation test**

Test `validateContent(process.cwd())` and assert there are no errors and at least one episode file is checked.

- [ ] **Step 2: Run the test and verify it fails because content is absent**

Run: `node --test tests/content-validation.test.mjs`

Expected: FAIL because no repository fixture episode is present.

- [ ] **Step 3: Create the labelled fixture episode and artwork**

Write factual placeholder copy only: label the title, excerpt, description, artwork, and article body as fixture/demo material. Use categories only as interface examples, not claims about a real episode. Use DJ and Warren host IDs without adding biographies. Draw abstract mirror/moon geometry in SVG using the approved palette and include visible `FIXTURE ARTWORK` text. Add a matching project-owned favicon and crawler file.

- [ ] **Step 4: Verify schema, validation, and build ingestion**

Run: `npm run validate:content && npm run check`

Expected: PASS; Astro recognizes the fixture collection entry.

- [ ] **Step 5: Commit the fixture slice**

```bash
git add wwwroot/src/content/episodes wwwroot/public wwwroot/tests/content-validation.test.mjs
git commit -m "content: add labelled phase 1 episode fixture"
```

### Task 5: Implement the Bespoke Responsive Shell and Components

**Files:**

- Create: `src/styles/tokens.css`
- Create: `src/styles/global.css`
- Create: `src/layouts/BaseLayout.astro`
- Create: `src/layouts/EpisodeLayout.astro`
- Create: `src/components/layout/Header.astro`
- Create: `src/components/layout/Footer.astro`
- Create: `src/components/common/CelestialMark.astro`
- Create: `src/components/common/SectionHeading.astro`
- Create: `src/components/episodes/CategoryBadge.astro`
- Create: `src/components/episodes/EpisodeCard.astro`
- Create: `src/components/episodes/EpisodePlatformLinks.astro`
- Create: `src/components/episodes/EpisodeAudioPlayer.astro`
- Create: `src/components/episodes/EpisodeHero.astro`
- Create: `src/components/hosts/HostCard.astro`
- Test: `tests/render-contract.test.mjs`

**Interfaces:**

- Produces: reusable page chrome and content components with typed Astro props.
- Consumes: central site/category/platform configuration, host JSON, and episode entry types.

- [ ] **Step 1: Write a failing static render-contract test**

Assert the planned layout/component files exist and inspect their source for semantic requirements: header contains a home link and labelled navigation, audio uses native `<audio controls>`, external-link rendering includes safe `rel`, host cards do not substitute biography text, and global CSS contains focus-visible and reduced-motion rules.

- [ ] **Step 2: Run the test and verify missing-file failures**

Run: `node --test tests/render-contract.test.mjs`

Expected: FAIL because the presentation files do not exist.

- [ ] **Step 3: Implement tokens and global atmosphere**

Define the required gold and ivory exactly, near-black layered backgrounds, restrained plum clouds, thin border treatments, high-contrast serif stack, readable sans stack, spacing/measure tokens, and content-led breakpoints. Use CSS gradients only for atmosphere and fine details. Add skip-link, focus-visible, visually-hidden, and reduced-motion utilities.

- [ ] **Step 4: Implement layout, navigation, and footer**

Build semantic document metadata and canonical URLs in `BaseLayout`. Use a button-controlled mobile menu with `aria-expanded`, Escape handling, outside-click closing, and no dependency. Ensure all primary links resolve to Phase 1 routes. Footer platform links filter empty values.

- [ ] **Step 5: Implement episode and host components**

Render metadata-driven links only when populated. Use the browser-native audio player without autoplay. Use thin framed editorial cards, restrained ornaments, and placeholder wording that asks for supplied biography/image content without inventing it.

- [ ] **Step 6: Run render contracts and Astro checks**

Run: `npm test && npm run check`

Expected: PASS.

- [ ] **Step 7: Commit the design-system slice**

```bash
git add wwwroot/src/styles wwwroot/src/layouts wwwroot/src/components wwwroot/tests/render-contract.test.mjs
git commit -m "feat: build celestial responsive site shell"
```

### Task 6: Build Homepage, Episode, Category, Host, Listen, and Placeholder Routes

**Files:**

- Create: `src/pages/index.astro`
- Create: `src/pages/episodes/index.astro`
- Create: `src/pages/episodes/[slug].astro`
- Create: `src/pages/categories/index.astro`
- Create: `src/pages/categories/[category].astro`
- Create: `src/pages/hosts/index.astro`
- Create: `src/pages/hosts/dj.astro`
- Create: `src/pages/hosts/warren.astro`
- Create: `src/pages/listen/index.astro`
- Create: `src/pages/daily-mirror/index.astro`
- Create: `src/pages/astrology/index.astro`
- Create: `src/pages/about/index.astro`
- Create: `src/pages/404.astro`
- Test: `tests/route-contract.test.mjs`

**Interfaces:**

- Produces: static HTML routes for every primary navigation destination and required Phase 1 content path.
- Consumes: components from Task 5 and episode/category helpers from Task 2.

- [ ] **Step 1: Write the failing route-contract test**

Assert the required source routes exist, dynamic routes export `getStaticPaths`, the homepage queries publishable episodes, category paths derive only from controlled keys, the Listen page references `/rss.xml`, and later-phase placeholders explicitly say their data/interaction has not yet been supplied or implemented.

- [ ] **Step 2: Run the route test and verify missing-file failures**

Run: `node --test tests/route-contract.test.mjs`

Expected: FAIL because the routes do not exist.

- [ ] **Step 3: Implement homepage and episode routes**

Feature the latest episode, render recent episodes without duplicating the featured entry, and include restrained future-feature and host sections. Build static detail paths from non-draft entries. Render Markdown through Astro's collection API inside `EpisodeLayout`; automatically render categories, available platform links, and audio metadata outside the Markdown body.

- [ ] **Step 4: Implement category and host routes**

Generate category pages from the controlled mapping even when a category has no episodes. Render honest empty states. Resolve hosts by ID from the central JSON and keep biographies/images absent.

- [ ] **Step 5: Implement Listen and future-phase placeholder routes**

Show RSS as a normal link plus a progressively enhanced copy button. Render only configured podcast platforms. Add restrained placeholder pages for Daily Mirror, Daily Astrology, and About so navigation is complete without implying those phases are implemented.

- [ ] **Step 6: Build and inspect generated routes**

Run: `npm test && npm run check && npm run build`

Expected: PASS, with generated HTML for `/`, `/episodes/`, the fixture detail route, all category routes, host routes, Listen, future placeholders, and 404.

- [ ] **Step 7: Commit the route slice**

```bash
git add wwwroot/src/pages wwwroot/tests/route-contract.test.mjs
git commit -m "feat: add phase 1 publication routes"
```

### Task 7: Generate the First-Party Podcast RSS Feed

**Files:**

- Create: `src/pages/rss.xml.ts`
- Create: `tests/rss-contract.test.mjs`
- Modify: `src/utils/rss.ts`

**Interfaces:**

- Produces: `GET()` returning `application/rss+xml` and a valid podcast RSS channel.
- Consumes: non-draft episodes, `hasCompleteEnclosure`, and central site configuration.

- [ ] **Step 1: Write the failing RSS contract tests**

Test pure XML serialization with an empty item set and one complete enclosure. Assert XML escaping, stable GUID/link generation, RFC-compatible dates, enclosure URL/type/length, duration, episode number, and podcast namespace declarations. Assert incomplete enclosure episodes are excluded.

- [ ] **Step 2: Run the RSS test and verify missing serializer failure**

Run: `node --test tests/rss-contract.test.mjs`

Expected: FAIL because the serializer/route contract is absent.

- [ ] **Step 3: Implement explicit podcast XML generation**

Use an explicit serializer rather than a generic feed helper so namespace control is visible. Include only factual configured channel metadata. Add channel title, canonical link, description, language, self link, and conservative podcast type declarations that do not require invented owner or explicit-content values. Add complete episode items only, XML-escape every content-derived value, and return UTF-8 XML.

- [ ] **Step 4: Verify RSS tests and generated artifact**

Run: `npm test && npm run build`

Expected: PASS and `dist/rss.xml` exists, parses as XML, and contains no fixture enclosure item.

- [ ] **Step 5: Commit the RSS slice**

```bash
git add wwwroot/src/pages/rss.xml.ts wwwroot/src/utils/rss.ts wwwroot/tests/rss-contract.test.mjs
git commit -m "feat: generate first-party podcast RSS feed"
```

### Task 8: Add Authoring and Distribution Documentation

**Files:**

- Create: `docs/content-authoring.md`
- Create: `docs/podcast-distribution.md`
- Test: `tests/documentation-contract.test.mjs`

**Interfaces:**

- Produces: an owner-usable weekly episode workflow and empty distribution checklist.
- Consumes: package scripts, paths, controlled categories, and branch flow implemented earlier.

- [ ] **Step 1: Write the failing documentation contract test**

Assert both documents exist. Check the authoring guide contains `npm run new:episode`, `npm run validate:content`, `npm run dev`, artwork placement, the `dev` to `main` review flow, and a complete schema-compatible example. Check the distribution guide includes every specified platform, a blank show URL field, an unsubmitted status, and the canonical RSS path without fabricated URLs.

- [ ] **Step 2: Run the test and verify missing-document failures**

Run: `node --test tests/documentation-contract.test.mjs`

Expected: FAIL because the documents do not exist.

- [ ] **Step 3: Write the practical authoring guide and distribution checklist**

Keep instructions short and executable. Clearly distinguish the fixture example from real content. Explain that audio enclosure URL, MIME type, and bytes must be supplied together for RSS inclusion. List exact locations for episode Markdown and artwork.

- [ ] **Step 4: Run documentation and full tests**

Run: `npm test && npm run validate:content`

Expected: PASS.

- [ ] **Step 5: Commit the documentation slice**

```bash
git add wwwroot/docs/content-authoring.md wwwroot/docs/podcast-distribution.md wwwroot/tests/documentation-contract.test.mjs
git commit -m "docs: add episode and distribution workflows"
```

### Task 9: Add Non-Deployment CI

**Files:**

- Create: `.github/workflows/ci.yml`
- Create: `tests/ci-contract.test.mjs`

**Interfaces:**

- Produces: CI on pull requests and pushes to `dev` and `main` using Node 22.
- Consumes: lockfile and npm commands from Task 1.

- [ ] **Step 1: Write the failing CI contract test**

Parse the workflow as YAML and assert checkout/setup actions, Node 22, npm caching, and ordered commands for `npm ci`, `npm test`, `npm run check`, `npm run validate:content`, and `npm run build`. Assert no Wrangler or deployment command appears.

- [ ] **Step 2: Run the test and verify the missing-workflow failure**

Run: `node --test tests/ci-contract.test.mjs`

Expected: FAIL because `.github/workflows/ci.yml` does not exist.

- [ ] **Step 3: Create the CI workflow**

Use supported official checkout and Node setup actions. Trigger all pull requests and only `dev`/`main` pushes. Grant read-only repository contents permission, use `npm ci`, and run every local verification command. Do not include secrets or deployment steps.

- [ ] **Step 4: Run full local verification**

Run: `npm test && npm run check && npm run validate:content && npm run build`

Expected: every command exits zero with no errors.

- [ ] **Step 5: Commit the CI slice**

```bash
git add wwwroot/.github/workflows/ci.yml wwwroot/tests/ci-contract.test.mjs
git commit -m "ci: validate phase 1 site"
```

### Task 10: Final Responsive, Accessibility, and Local Runtime Verification

**Files:**

- Modify: only files with defects found during verification.
- Create: no new product scope.

**Interfaces:**

- Produces: verified Phase 1 handoff evidence.
- Consumes: all prior tasks.

- [ ] **Step 1: Run the complete clean verification sequence**

Run:

```bash
npm ci
npm test
npm run check
npm run validate:content
npm run build
```

Expected: every command exits zero; tests report zero failures; Astro reports zero errors; content validator reports zero errors; build completes and emits all routes.

- [ ] **Step 2: Start the local preview and smoke-check important routes**

Run `npm run preview -- --host 127.0.0.1` in a persistent session. Request `/`, `/episodes/`, the fixture episode path, `/categories/`, one populated category, `/hosts/`, `/hosts/dj/`, `/hosts/warren/`, `/listen/`, `/daily-mirror/`, `/astrology/`, `/about/`, `/rss.xml`, and a missing path. Verify expected success statuses and the styled 404 response.

- [ ] **Step 3: Inspect visual behaviour at required widths**

Use a browser at 375, 430, 768, 1024, and 1440 CSS pixels. Verify no horizontal overflow, readable typography, wrapped action links, single/two/three-column transitions, keyboard mobile navigation, visible focus, and no bright green. Compare the atmosphere, fine framing, typography, and ornaments against the supplied reference without copying its chroma-key panels.

- [ ] **Step 4: Inspect generated HTML and RSS**

Confirm canonical/meta descriptions, valid heading order, image alt text, safe external link relations, native audio omission when unavailable, empty platform omission, fixture labels, draft exclusion, and XML parseability. Confirm fixture content is absent from RSS because it lacks a complete enclosure.

- [ ] **Step 5: Fix only verified defects and rerun affected plus full checks**

For each defect, add or strengthen a failing automated test where practical, observe it fail, implement the smallest fix, rerun the focused test, then rerun the full command sequence from Step 1.

- [ ] **Step 6: Review the final change set and repository state**

Run:

```bash
git diff --check
git status --short
git log --oneline --decorate -12
```

Confirm no unrelated parent-repository files, credentials, generated `dist`, or `node_modules` are staged or committed.

- [ ] **Step 7: Commit final verification fixes if any**

```bash
git add <only-the-verified-phase-1-files>
git commit -m "fix: close phase 1 verification findings"
```

- [ ] **Step 8: Prepare the Phase 1 handoff**

Report the final relevant tree, exact local commands, fresh verification results, implemented scope, all fixture/placeholder content, and exact Phase 2 inputs required from the owner. State explicitly that nothing was deployed and Phase 2 was not started.
