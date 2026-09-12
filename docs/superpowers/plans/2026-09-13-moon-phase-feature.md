# Moon Phase Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render the visitor-local current Moon phase on the homepage, Daily Mirror, and a dedicated Moon page using local calculation, static content, and replaceable SVG artwork.

**Architecture:** Preserve the existing Astro/Cloudflare server-rendered architecture and derive a typed Moon view model from `Astro.request.cf?.timezone` on each relevant request. Separate timezone/date handling, deterministic phase calculation, JSON content, image mapping, and Astro presentation; mark timezone-dependent HTML private and uncacheable.

**Tech Stack:** Astro 7, `@astrojs/cloudflare`, TypeScript 6, Node test runner, static JSON, static SVG.

**Spec:** `docs/superpowers/specs/2026-09-13-moon-phase-feature-design.md`

## Global Constraints

- Support exactly `new-moon`, `waxing-crescent`, `first-quarter`, `waxing-gibbous`, `full-moon`, `waning-gibbous`, `last-quarter`, and `waning-crescent`.
- Use `request.cf.timezone` when available and fall back safely to `UTC` when it is absent or invalid.
- Resolve the visitor-local `YYYY-MM-DD`, then calculate at UTC noon for that selected calendar date.
- Use no Moon API, astronomy SaaS, browser GPS, database, frontend framework, UI library, or new runtime dependency.
- Keep editorial content in static JSON and images as independently replaceable files under `public/images/moon/`.
- Set `Cache-Control: private, no-store` on every HTML route whose Moon output varies by visitor timezone.
- Reuse existing CSS variables, scoped Astro styles, `BaseLayout`, site containers, panels, typography, and responsive conventions.
- Preserve unrelated working-tree changes, including the existing Wrangler observability files and location manifest.

---

### Task 1: Visitor-local date and Moon phase domain

**Files:**
- Create: `src/lib/moon/moon-date.ts`
- Create: `src/lib/moon/moon-phase.ts`
- Test: `tests/moon-phase.test.ts`

**Interfaces:**
- Produces: `MOON_PHASES`, `MoonPhase`, `MOON_PHASE_LABELS`, `MOON_PHASE_IMAGES`, `getMoonPhase(date: Date): MoonPhase`.
- Produces: `DEFAULT_MOON_TIME_ZONE`, `getRequestTimeZone(request: Request): string`, `getVisitorLocalDate(date: Date, timeZone: string): string`, and `localDateToCalculationDate(localDate: string): Date`.

- [ ] **Step 1: Write failing date tests**

Create requests with a test-only `cf` property and assert independently derived literals:

```ts
const instant = new Date("2026-09-13T10:30:00.000Z");
assert.equal(getVisitorLocalDate(instant, "Pacific/Kiritimati"), "2026-09-14");
assert.equal(getVisitorLocalDate(instant, "Pacific/Honolulu"), "2026-09-13");
assert.equal(getRequestTimeZone(new Request("https://example.test")), "UTC");
assert.equal(getRequestTimeZone(requestWithCf("Australia/Adelaide")), "Australia/Adelaide");
assert.equal(getRequestTimeZone(requestWithCf("Not/A_Timezone")), "UTC");
assert.equal(localDateToCalculationDate("2026-09-14").toISOString(), "2026-09-14T12:00:00.000Z");
```

- [ ] **Step 2: Run the date tests and verify RED**

Run: `node --import tsx --test tests/moon-phase.test.ts`

Expected: FAIL because the Moon modules do not exist.

- [ ] **Step 3: Implement safe timezone and date helpers**

Use one narrow request boundary and validate timezones before formatting:

```ts
export const DEFAULT_MOON_TIME_ZONE = "UTC";

interface CloudflareRequest extends Request {
  cf?: { timezone?: unknown };
}

export function getRequestTimeZone(request: Request): string {
  const candidate = (request as CloudflareRequest).cf?.timezone;
  if (typeof candidate !== "string") return DEFAULT_MOON_TIME_ZONE;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: candidate }).format(0);
    return candidate;
  } catch {
    return DEFAULT_MOON_TIME_ZONE;
  }
}
```

Use `Intl.DateTimeFormat(...).formatToParts()` for stable numeric year/month/day extraction. Validate `YYYY-MM-DD` in `localDateToCalculationDate` and throw a descriptive error for malformed internal input.

- [ ] **Step 4: Write failing phase-sector tests**

Add literal instants representing the reference and the centre of every sector:

```ts
const cases = [
  ["2000-01-06T18:14:00.000Z", "new-moon"],
  ["2000-01-10T10:49:30.359Z", "waxing-crescent"],
  ["2000-01-14T03:25:00.719Z", "first-quarter"],
  ["2000-01-17T20:00:31.078Z", "waxing-gibbous"],
  ["2000-01-21T12:36:01.438Z", "full-moon"],
  ["2000-01-25T05:11:31.798Z", "waning-gibbous"],
  ["2000-01-28T21:47:02.157Z", "last-quarter"],
  ["2000-02-01T14:22:32.517Z", "waning-crescent"],
  ["2000-02-03T19:31:50.733Z", "new-moon"],
  ["2000-01-03T19:21:35.712Z", "waning-crescent"],
] as const;
```

Test these checked literal pairs one millisecond before and at each boundary:

```ts
const boundaries = [
  ["2000-01-12T07:07:15.539Z", "waxing-crescent", "2000-01-12T07:07:15.540Z", "first-quarter"],
  ["2000-01-19T16:18:16.258Z", "waxing-gibbous", "2000-01-19T16:18:16.259Z", "full-moon"],
  ["2000-01-27T01:29:16.977Z", "waning-gibbous", "2000-01-27T01:29:16.978Z", "last-quarter"],
  ["2000-02-03T10:40:17.697Z", "waning-crescent", "2000-02-03T10:40:17.698Z", "new-moon"],
] as const;
```

- [ ] **Step 5: Run the phase tests and verify RED**

Run: `node --import tsx --test tests/moon-phase.test.ts`

Expected: FAIL because phase exports are absent.

- [ ] **Step 6: Implement the canonical phase model and calculation**

Define the canonical tuple, derived union, exhaustive label/image records, constants from the brief, positive modulo, and ordered thresholds. Keep all phase slugs and mappings in this module so consumers cannot invent alternate identifiers.

- [ ] **Step 7: Run the focused tests and verify GREEN**

Run: `node --import tsx --test tests/moon-phase.test.ts`

Expected: all Moon date and phase tests PASS.

- [ ] **Step 8: Commit the domain slice**

```bash
git add src/lib/moon/moon-date.ts src/lib/moon/moon-phase.ts tests/moon-phase.test.ts
git commit -m "feat: calculate visitor-local moon phases"
```

---

### Task 2: Typed phase content and replaceable artwork

**Files:**
- Create: `src/data/moon-phases.json`
- Create: `src/lib/moon/moon-phase-content.ts`
- Create: `public/images/moon/new-moon.svg`
- Create: `public/images/moon/waxing-crescent.svg`
- Create: `public/images/moon/first-quarter.svg`
- Create: `public/images/moon/waxing-gibbous.svg`
- Create: `public/images/moon/full-moon.svg`
- Create: `public/images/moon/waning-gibbous.svg`
- Create: `public/images/moon/last-quarter.svg`
- Create: `public/images/moon/waning-crescent.svg`
- Test: `tests/moon-phase-content.test.ts`

**Interfaces:**
- Consumes: `MoonPhase`, `MOON_PHASES`, `MOON_PHASE_LABELS`, and `MOON_PHASE_IMAGES` from Task 1.
- Produces: `MoonPhaseContent`, `MoonPhaseViewModel`, `getMoonPhaseContent(phase: MoonPhase): MoonPhaseContent`, and `getMoonPhaseViewModel(request: Request, now?: Date): MoonPhaseViewModel`.

- [ ] **Step 1: Write failing exhaustive mapping tests**

For every literal slug in `MOON_PHASES`, assert that the label is non-empty, JSON has exactly the required fields and matching name, the image path is `/images/moon/<slug>.svg`, and `access(new URL("../public" + imagePath, import.meta.url))` succeeds. Assert the JSON key set exactly equals the canonical slug set.

- [ ] **Step 2: Run mapping tests and verify RED**

Run: `node --import tsx --test tests/moon-phase-content.test.ts`

Expected: FAIL because JSON, content helpers, and SVG files do not exist.

- [ ] **Step 3: Add static JSON and the typed content adapter**

Give every phase a matching `name`, one-sentence `summary`, short `meaning` and `energy`, and non-empty `focus`, `reflection`, and `practices` arrays. Export this contract:

```ts
export interface MoonPhaseContent {
  name: string;
  summary: string;
  meaning: string;
  energy: string;
  focus: string[];
  reflection: string[];
  practices: string[];
}

export interface MoonPhaseViewModel extends MoonPhaseContent {
  date: string;
  phase: MoonPhase;
  image: string;
}
```

Validate all eight entries at module initialisation and throw a descriptive development/build error for malformed repository content. `getMoonPhaseViewModel` uses `getRequestTimeZone`, `getVisitorLocalDate`, `localDateToCalculationDate`, `getMoonPhase`, and the exhaustive mappings.

- [ ] **Step 4: Add the eight temporary SVG files**

Create a consistent `viewBox="0 0 240 240"` set using a dark circular Moon base, ivory/gold illuminated shapes, subtle crater circles, and masks for crescent/gibbous silhouettes. Waxing illumination appears on the right and waning illumination on the left. Each file remains standalone and uses no external resources.

- [ ] **Step 5: Run mapping tests and verify GREEN**

Run: `node --import tsx --test tests/moon-phase-content.test.ts`

Expected: all content and asset mapping tests PASS.

- [ ] **Step 6: Commit the content and artwork slice**

```bash
git add src/data/moon-phases.json src/lib/moon/moon-phase-content.ts public/images/moon tests/moon-phase-content.test.ts
git commit -m "feat: add moon phase content and artwork"
```

---

### Task 3: Reusable Moon presentation components

**Files:**
- Create: `src/components/moon/MoonPhaseVisual.astro`
- Create: `src/components/moon/MoonPhaseCard.astro`
- Test: `tests/moon-phase-components.test.ts`

**Interfaces:**
- Consumes: `MoonPhaseViewModel` and `MOON_PHASE_IMAGES`.
- Produces: `MoonPhaseVisual` props `{ phase: MoonPhase; label: string; decorative?: boolean; size?: "compact" | "large" }`.
- Produces: `MoonPhaseCard` props `{ moon: MoonPhaseViewModel; variant?: "home" | "daily" }`.

- [ ] **Step 1: Write failing component contract tests**

Follow the repository’s existing Astro source-contract test convention: read both component files and assert the card renders “Today’s Moon,” `moon.name`, `moon.summary`, `href="/moon/"`, and `<MoonPhaseVisual phase={moon.phase} label={moon.name} />`. Assert the visual renders `MOON_PHASE_IMAGES[phase]` and `alt={decorative ? "" : `${label} Moon phase`}`. The production build in Task 6 validates Astro compilation and rendering integration.

- [ ] **Step 2: Run component tests and verify RED**

Run: `node --import tsx --test tests/moon-phase-components.test.ts`

Expected: FAIL because both Astro components do not exist.

- [ ] **Step 3: Implement `MoonPhaseVisual.astro`**

Render a responsive `<img>` using the exhaustive mapping, explicit dimensions, `loading="lazy"`, and `alt={decorative ? "" : `${label} Moon phase`}`. Use scoped styles for compact and large sizing with the existing gold, ivory, panel, and border tokens.

- [ ] **Step 4: Implement `MoonPhaseCard.astro`**

Render one keyboard-accessible `/moon/` anchor containing the visual, eyebrow, `h2` phase name, summary, and “Explore the Moon phase →” CTA. Use a celestial two-column compact layout that collapses cleanly on narrow screens and reuses `framed-panel` plus site tokens.

- [ ] **Step 5: Run component tests and verify GREEN**

Run: `node --import tsx --test tests/moon-phase-components.test.ts`

Expected: component contract tests PASS.

- [ ] **Step 6: Commit reusable components**

```bash
git add src/components/moon tests/moon-phase-components.test.ts
git commit -m "feat: add reusable moon phase components"
```

---

### Task 4: Homepage and Daily Mirror integration

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/daily-mirror/index.astro`
- Test: `tests/moon-phase-pages.test.ts`

**Interfaces:**
- Consumes: `getMoonPhaseViewModel(Astro.request)` and `MoonPhaseCard`.
- Produces: visitor-local Moon cards on `/` and `/daily-mirror/`, plus explicit private no-store response headers.

- [ ] **Step 1: Write failing page integration tests**

Assert both pages import and render `MoonPhaseCard`, derive one Moon view model from `Astro.request`, link through the reusable component, and set `Cache-Control` to the exact value `private, no-store`. Assert the homepage Moon integration remains inside the existing `mirror-preview` section and the Daily Mirror integration follows the tarot article rather than altering it.

- [ ] **Step 2: Run page tests and verify RED**

Run: `node --import tsx --test tests/moon-phase-pages.test.ts`

Expected: FAIL because neither page integrates the Moon feature.

- [ ] **Step 3: Integrate the homepage card**

In frontmatter, create `const moon = getMoonPhaseViewModel(Astro.request)` and set the response header. Add `<MoonPhaseCard moon={moon} variant="home" />` inside “Explore the mirror.” Retain all four existing tiles, use two columns for the grid from 42rem, and use five equal columns from 64rem so the desktop row remains balanced without squeezing tablet cards.

- [ ] **Step 4: Integrate the Daily Mirror card**

Create the same request-derived view model and header in frontmatter. Add `<MoonPhaseCard moon={moon} variant="daily" />` between the tarot article and reflective disclaimer. Do not duplicate calculation code or modify the existing client tarot refresh behavior.

- [ ] **Step 5: Run page and existing homepage tests**

Run: `node --import tsx --test tests/moon-phase-pages.test.ts tests/homepage-tarot-preview.test.ts`

Expected: all selected tests PASS.

- [ ] **Step 6: Commit route integration**

```bash
git add src/pages/index.astro src/pages/daily-mirror/index.astro tests/moon-phase-pages.test.ts
git commit -m "feat: show moon phase in daily experiences"
```

---

### Task 5: Dedicated visitor-local Moon page

**Files:**
- Create: `src/pages/moon/index.astro`
- Modify: `tests/moon-phase-pages.test.ts`

**Interfaces:**
- Consumes: `BaseLayout`, `MoonPhaseVisual`, and `getMoonPhaseViewModel(Astro.request)`.
- Produces: server-rendered `/moon/` with current phase content and `Cache-Control: private, no-store`.

- [ ] **Step 1: Add failing dedicated-page tests**

Assert `/moon/` uses `BaseLayout` with title `Today’s Moon Phase`, the specified evergreen description, the request-derived Moon view model, large mapped artwork, visible local date and phase name, and semantic sections for Meaning, Energy, What to focus on, Reflection, and Practices. Assert it sets the exact private no-store header.

- [ ] **Step 2: Run the page tests and verify RED**

Run: `node --import tsx --test tests/moon-phase-pages.test.ts`

Expected: FAIL because `src/pages/moon/index.astro` does not exist.

- [ ] **Step 3: Implement `/moon/`**

Use `BaseLayout`, a site-container hero with `MoonPhaseVisual size="large"`, an eyebrow showing `Today’s Moon · <date>`, prominent phase name and summary, then a reading-column content grid sourced exclusively from JSON. Render array fields as semantic lists and apply only scoped responsive styles using existing tokens.

- [ ] **Step 4: Run all Moon tests and verify GREEN**

Run: `node --import tsx --test tests/moon-phase.test.ts tests/moon-phase-content.test.ts tests/moon-phase-components.test.ts tests/moon-phase-pages.test.ts`

Expected: all Moon tests PASS.

- [ ] **Step 5: Commit the Moon page**

```bash
git add src/pages/moon/index.astro tests/moon-phase-pages.test.ts
git commit -m "feat: add visitor-local moon phase page"
```

---

### Task 6: Full verification and acceptance audit

**Files:**
- Modify only if verification exposes a Moon-feature defect.

**Interfaces:**
- Consumes: all completed feature slices.
- Produces: evidence that the implementation meets the brief without regressing the site.

- [ ] **Step 1: Run focused Moon tests**

Run: `node --import tsx --test tests/moon-phase.test.ts tests/moon-phase-content.test.ts tests/moon-phase-components.test.ts tests/moon-phase-pages.test.ts`

Expected: PASS with zero failures.

- [ ] **Step 2: Run the complete repository test suite**

Run: `npm test`

Expected: PASS with zero failures.

- [ ] **Step 3: Validate content**

Run: `npm run validate:content`

Expected: `Content validation passed.`

- [ ] **Step 4: Run Astro type checking**

Run: `npm run check`

Expected: PASS, or report any independently confirmed pre-existing baseline failure separately with its exact file and diagnostic.

- [ ] **Step 5: Build the Cloudflare production output**

Run: `npm run build:prod`

Expected: Astro build exits 0 and emits the Cloudflare server output with `/`, `/daily-mirror/`, and `/moon/` as runtime routes.

- [ ] **Step 6: Inspect generated route and asset output**

Confirm the route manifest keeps all three Moon-bearing pages server-rendered, every mapped SVG exists in the built assets, and no `/api/moon` endpoint or client hydration bundle was added.

- [ ] **Step 7: Audit requirements and working tree**

Re-read the acceptance criteria in `swm-moon-phase-feature.md`, inspect `git diff --check`, `git status --short`, and the feature commits, and confirm unrelated pre-existing files were neither staged nor committed. Do not revert user-owned Wrangler or location-manifest changes.

- [ ] **Step 8: Report the completed deliverable**

List files created and modified, architecture, visitor timezone/date flow, calculation, replacement locations, cache/rendering choices, tests, commands, and exact results.
