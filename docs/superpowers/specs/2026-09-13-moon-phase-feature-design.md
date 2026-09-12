# Moon Phase Feature Design

## Goal

Add a visitor-local Moon phase experience to the homepage, Daily Mirror, and a dedicated `/moon/` page without external APIs, client geolocation, a database, or a new frontend dependency.

The feature supports exactly eight canonical phase slugs and keeps calculation, editorial content, imagery, and presentation separate so final copy and artwork can be replaced without changing application logic.

## Existing architecture

The site uses Astro 7 with `@astrojs/cloudflare`, `output: "server"`, and the Cloudflare Worker entrypoint. The homepage (`src/pages/index.astro`) and Daily Mirror (`src/pages/daily-mirror/index.astro`) do not opt into prerendering, so both are already rendered per request. Routes that explicitly set `export const prerender = true` remain static.

The site uses server-rendered Astro components, scoped component styles, shared CSS tokens from `src/styles/tokens.css`, JSON content under `src/data`, TypeScript domain utilities, and public imagery under `public/images`. The homepage already has an “Explore the mirror” grid, which is the natural location for the compact Moon entry.

## Rendering and cache architecture

The homepage, `/daily-mirror/`, and `/moon/` remain server-rendered. Each route resolves its Moon view model directly from the incoming Cloudflare request and renders complete accessible HTML without client hydration or an API endpoint.

Because the rendered Moon output varies by the request timezone and local date, all three routes explicitly emit `Cache-Control: private, no-store`. This prevents an intermediary or Cloudflare cache rule from sharing one timezone-dependent response globally. Static SVG assets remain independently cacheable by the normal asset pipeline.

A client-side-only implementation and a hydrated Moon API were rejected because the existing pages already have runtime request access. Either alternative would add JavaScript, an extra request, and an initial rendering mismatch without improving correctness.

## Visitor-local date resolution

A focused date helper accepts a request-like value and the current instant. It reads `request.cf?.timezone` when Cloudflare provides it, validates the IANA timezone by constructing an `Intl.DateTimeFormat`, and falls back to `UTC` when metadata is missing or invalid.

The helper formats the instant as the visitor’s `YYYY-MM-DD` using `formatToParts`; it never uses the server timezone or assumes Australia. The calendar date is then represented as `12:00:00Z` for the Moon calculation. UTC noon is a stable neutral instant within that selected calendar date and prevents midnight conversion from accidentally shifting the calculation to an adjacent date.

The page receives a small typed view model containing the resolved date, phase slug, label, image path, and phase content. Timezone details remain an implementation concern and are not displayed to visitors.

## Moon phase domain model

`src/lib/moon/moon-phase.ts` owns the canonical eight-slug tuple and derived `MoonPhase` type, human-readable labels, image mappings, and deterministic phase calculation.

The calculation uses:

- synodic month length `29.530588853` days;
- `86,400,000` milliseconds per day;
- known new moon reference `2000-01-06 18:14 UTC`;
- positive modulo so dates before the reference remain supported;
- eight equal phase sectors centred on the principal phases, with New Moon wrapping around the cycle boundary.

`src/lib/moon/moon-date.ts` owns request timezone extraction, safe timezone validation, local calendar-date formatting, and conversion of a calendar date to the UTC-noon calculation instant. `src/lib/moon/moon-phase-content.ts` validates and exposes the JSON-backed phase content and produces the page/component view model. These boundaries keep request handling, astronomy, and editorial data independently testable.

## Content and image model

`src/data/moon-phases.json` contains one canonical entry for every phase. Each entry has `name`, `summary`, `meaning`, `energy`, `focus`, `reflection`, and `practices`. Temporary but usable editorial copy fills the structure now; final editorial content can replace those values without touching components.

Eight temporary SVGs live in `public/images/moon/` and share the exact canonical filenames. They use a consistent square view box, celestial palette, and waxing/waning orientation. The files are referenced through one exhaustive `Record<MoonPhase, string>`, allowing final artwork to replace the files in place without code changes.

If content is unexpectedly unavailable at runtime, the view-model helper falls back to a safe typed New Moon entry while reporting a development error. Exhaustive tests and TypeScript mappings make missing entries an expected build/test-time failure. A missing static file cannot be detected reliably during a Worker request, so repository tests verify every mapped asset exists.

## Components and page integration

`MoonPhaseVisual.astro` renders the mapped image with either meaningful alt text or decorative treatment selected by the caller. `MoonPhaseCard.astro` renders the reusable compact experience: artwork, “Today’s Moon,” phase name, summary, and a clear link to `/moon/`.

The homepage adds the Moon card to the existing “Explore the mirror” cluster and adjusts only that grid’s responsive column behavior. The Daily Mirror adds the same card below the tarot reading as another reflective piece of the day. Neither page duplicates timezone, phase, content, or image logic.

The dedicated `/moon/` page uses `BaseLayout` metadata conventions, a larger Moon visual, the visitor-local date, phase name and summary, and phase-specific Meaning, Energy, Focus, Reflection, and Practices sections. Empty list sections remain structurally safe, though the initial placeholder content supplies useful copy for all fields. The page remains responsive using existing site containers, typography, panels, colours, spacing, and breakpoints.

## Accessibility

The phase name always appears as text, so meaning never relies only on the illuminated shape. Informative Moon images receive phase-specific alt text; repeated/decorative instances use empty alt text. Links remain native keyboard-accessible anchors with visible focus treatment inherited from the site. Heading order and list semantics describe the dedicated page content clearly.

## Testing and verification

Test-driven implementation adds focused Node tests for:

- the reference New Moon and representative First Quarter, Full Moon, and Last Quarter dates;
- waxing and waning sector boundaries, including cycle wraparound;
- positive modulo behavior before the reference date;
- different local dates for Kiritimati and Honolulu at the same instant;
- UTC fallback for absent and invalid Cloudflare timezone metadata;
- stable UTC-noon conversion from `YYYY-MM-DD`;
- all eight labels, JSON entries, image mappings, and physical SVG files;
- Moon component/page integration and links on the homepage and Daily Mirror;
- explicit no-store cache headers on all three timezone-dependent pages.

Final verification runs the focused Moon tests, full test suite, content validation, Astro type checking, and production build. Any pre-existing unrelated failure is reported separately with exact evidence. Generated Wrangler state changes are excluded from the feature diff.

## Scope boundaries

This feature does not alter existing tarot, colour, number, astrology, episode, host, navigation, or birth-chart behavior. It does not add an external Moon service, browser GPS, a database, client hydration, an API endpoint, animation, a UI framework, or new dependencies.
