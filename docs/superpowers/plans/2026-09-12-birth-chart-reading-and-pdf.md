# Birth Chart Reading and PDF Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Make generated birth charts understandable to non-specialists and downloadable as a private, browser-generated PDF guide.

**Architecture:** Keep `BirthChart` as the calculation result and introduce a pure `buildBirthChartReading(chart)` presentation model assembled from repository reference data plus explicit house and aspect dictionaries. Render that single model as accessible HTML and pass it to a dedicated jsPDF renderer, preventing the webpage and PDF from drifting.

**Tech Stack:** Astro 7, TypeScript 6, Node test runner, jsPDF, existing Swiss Ephemeris browser calculation and SVG renderer.

**Spec:** `docs/superpowers/specs/2026-09-12-birth-chart-reading-and-pdf-design.md`

## Global Constraints

- Present astrology as symbolic and reflective, never as scientific fact or fixed personality diagnosis.
- Keep birth details and PDF generation in the browser; add no persistence, analytics payload, server PDF endpoint, or database write.
- Use deterministic repository-owned interpretation copy; call no generative AI or external interpretation service.
- Fall back to exact placement facts when reference content is missing.
- Do not change chart calculations, Placidus houses, supported aspects, or orb definitions.
- Preserve unrelated working-tree changes.

---

### Task 1: Deterministic reading model

**Files:**
- Create: `src/lib/astrology/chart/interpretation.ts`
- Test: `tests/birth-chart-interpretation.test.ts`

**Interfaces:**
- Consumes: `BirthChart`, `PlanetPosition`, and `Aspect`; existing planet and zodiac reference JSON.
- Produces: `BirthChartReading`, `PlacementReading`, `AspectReading`, and `buildBirthChartReading(chart: BirthChart): BirthChartReading`.

- [x] **Step 1: Write the failing model tests**

Use a representative `BirthChart` fixture and assert headline order, exact degree formatting, planet/sign/house composition, ascending aspect-orb order, reflective disclaimer, and fact-only fallback for an unknown runtime reference key:

```ts
const reading = buildBirthChartReading(chart);
assert.deepEqual(reading.headlines.map(({ label }) => label), ["Sun", "Moon", "Ascendant", "Midheaven"]);
assert.match(reading.placements[0].interpretation, /identity/i);
assert.match(reading.placements[0].interpretation, /Aries/i);
assert.match(reading.placements[0].interpretation, /House 1/i);
assert.deepEqual(reading.aspects.map(({ orb }) => orb), [0.4, 2.1]);
assert.match(reading.disclaimer, /symbolic and reflective tradition/i);
```

- [x] **Step 2: Verify the test fails**

Run: `node --import tsx --test tests/birth-chart-interpretation.test.ts`

Expected: FAIL because `interpretation.ts` does not exist.

- [x] **Step 3: Implement the pure model**

Define:

```ts
export interface PlacementReading {
  name: PlanetName;
  symbol: string;
  position: string;
  houseLabel: string;
  role: string;
  interpretation: string;
}
export interface AspectReading {
  symbol: string;
  label: string;
  orb: number;
  interpretation: string;
}
export interface BirthChartReading {
  headlines: Array<{ label: string; position: string; meaning: string }>;
  placements: PlacementReading[];
  aspects: AspectReading[];
  legend: Array<{ term: string; meaning: string }>;
  disclaimer: string;
}
```

Add explicit descriptions for all twelve houses and five supported aspect types. Build placement language from planet `astrological_role`, zodiac `metaphysical_interpretation`, and the house life area using possibility language. Sort aspects by ascending orb. Use exact formatted facts only when lookup content is unavailable.

- [x] **Step 4: Verify the model test passes**

Run: `node --import tsx --test tests/birth-chart-interpretation.test.ts`

Expected: PASS.

- [x] **Step 5: Commit**

```bash
git add src/lib/astrology/chart/interpretation.ts tests/birth-chart-interpretation.test.ts
git commit -m "feat: add readable birth chart interpretations"
```

---

### Task 2: Accessible on-page reading

**Files:**
- Create: `src/components/astrology/render-chart-reading.ts`
- Modify: `src/components/astrology/NatalChart.ts`
- Modify: `src/lib/astrology/chart/render/render-svg.ts`
- Modify: `src/pages/astrology/birth-chart/index.astro`
- Test: `tests/birth-chart-rendering.test.ts`

**Interfaces:**
- Consumes: `buildBirthChartReading(chart)` and `renderBirthChartSvg(chart)`.
- Produces: `renderChartReading(reading: BirthChartReading, chart: BirthChart, metadata: ChartReadingMetadata): string`.

- [x] **Step 1: Write failing renderer and page-contract tests**

Assert the HTML contains `Your chart at a glance`, `Planet placements`, `Major aspects`, a chart legend, a technical `<details>` disclosure, escaped dynamic content, `id="chart-download"`, and the label `Download your chart guide`.

```ts
const html = renderChartReading(reading, chart, metadata);
assert.match(html, /Your chart at a glance/);
assert.match(html, /<details class="technical-details">/);
assert.doesNotMatch(html, /<script>/);
```

- [x] **Step 2: Verify the tests fail**

Run: `node --import tsx --test tests/birth-chart-rendering.test.ts`

Expected: FAIL because the renderer and download control are absent.

- [x] **Step 3: Implement safe semantic HTML rendering**

Create `escapeHtml(value: string): string` and apply it to every dynamic value. Render semantic overview, legend, placement, aspect, and technical sections. Preserve the exact placement table inside the disclosure. Include selected birthplace, entered local date/time, UTC instant, and `Placidus houses`. Render a clear empty state if no major aspect is present.

- [x] **Step 4: Connect the model after successful calculation**

Build the reading once in `NatalChart.ts`, render the SVG and reading, retain `{ chart, reading, date, time }` for downloading, and reveal the result/download controls. Reset previous download state when a new submission starts. Update the SVG accessible name to point readers to the adjacent legend and written result.

- [x] **Step 5: Add the page hierarchy and responsive styles**

Add a labelled generated-result region, download button, headline cards, readable placement cards, aspect list, line-style legend keys, styled technical disclosure, and mobile-safe table overflow. Use two placement columns only at wide breakpoints.

- [x] **Step 6: Verify focused and full tests**

```bash
node --import tsx --test tests/birth-chart-interpretation.test.ts tests/birth-chart-rendering.test.ts
npm test
```

Expected: PASS.

- [x] **Step 7: Commit**

```bash
git add src/components/astrology/render-chart-reading.ts src/components/astrology/NatalChart.ts src/lib/astrology/chart/render/render-svg.ts src/pages/astrology/birth-chart/index.astro tests/birth-chart-rendering.test.ts
git commit -m "feat: make birth chart results readable"
```

---

### Task 3: Private browser-generated PDF guide

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/astrology/chart/pdf.ts`
- Modify: `src/components/astrology/NatalChart.ts`
- Test: `tests/birth-chart-pdf.test.ts`

**Interfaces:**
- Consumes: `BirthChart`, `BirthChartReading`, local date/time strings.
- Produces: `birthChartPdfFilename(placeName: string, date: string): string`, `createBirthChartPdf(input: BirthChartPdfInput): Uint8Array`, and `downloadBirthChartPdf(input: BirthChartPdfInput): void`.

- [x] **Step 1: Install the runtime dependency**

Run: `npm install jspdf`

Expected: `jspdf` is added to runtime dependencies and its resolved tree to the lockfile.

- [x] **Step 2: Write failing filename and PDF tests**

```ts
assert.equal(birthChartPdfFilename("São Paulo / Central", "1990-01-01"), "birth-chart-sao-paulo-central-1990-01-01.pdf");
const bytes = createBirthChartPdf(input);
assert.equal(new TextDecoder().decode(bytes.slice(0, 5)), "%PDF-");
assert.ok(bytes.byteLength > 10_000);
assert.ok(countPdfPages(bytes) > 1);
```

Use a full eleven-planet fixture so the guide naturally paginates.

- [x] **Step 3: Verify the PDF test fails**

Run: `node --import tsx --test tests/birth-chart-pdf.test.ts`

Expected: FAIL because `pdf.ts` does not exist.

- [x] **Step 4: Implement PDF creation**

Use jsPDF primitives to draw the chart wheel from house cusps, planet longitudes, and aspects without canvas or server dependencies. Use planet names in the PDF rather than unsupported Unicode glyphs. Add helpers for wrapped paragraphs, page breaks, headings, rules, and `Page N` footers. Include cover details, chart wheel, legend, overview, every placement, aspects, glossary, technical notes, disclaimer, and the Birth Chart page link. Exclude coordinates and internal place ID. Return `new Uint8Array(doc.output("arraybuffer"))`.

- [x] **Step 5: Implement private browser download**

Wrap PDF bytes in a Blob, click a temporary download anchor, revoke its object URL, and use the safe filename helper. Bind one download click listener in `NatalChart.ts`; show `Preparing guide…` and `aria-busy="true"`, then restore the control. On failure, preserve the chart and show an actionable message in the existing alert region.

- [x] **Step 6: Verify PDF, full tests, and types**

```bash
node --import tsx --test tests/birth-chart-pdf.test.ts
npm test
npm run check
```

Expected: new and existing tests PASS. If the known unrelated `src/pages/daily-mirror/index.astro:58` error remains, confirm there are no diagnostics in files changed by this plan.

- [x] **Step 7: Commit**

```bash
git add package.json package-lock.json src/lib/astrology/chart/pdf.ts src/components/astrology/NatalChart.ts tests/birth-chart-pdf.test.ts
git commit -m "feat: add downloadable birth chart guide"
```

---

### Task 4: End-to-end verification

**Files:**
- Modify: `docs/superpowers/plans/2026-09-12-birth-chart-reading-and-pdf.md` to mark completed steps.
- Modify: `docs/superpowers/specs/2026-09-12-birth-chart-reading-and-pdf-design.md` only if implementation reveals a necessary factual correction.

**Interfaces:**
- Consumes: completed web reading and PDF flow.
- Produces: desktop, mobile, PDF, privacy, and regression evidence.

- [x] **Step 1: Run repository checks**

```bash
npm test
npm run check
git diff --check
```

Expected: tests PASS and no whitespace errors; report any pre-existing diagnostic separately from changed-file diagnostics.

- [x] **Step 2: Verify the result in a browser**

Run the local Astro site and generate a representative chart at desktop and mobile widths. Confirm result order, readable chart/legend, keyboard-reachable controls, horizontally safe tables, and absence of console errors.

- [x] **Step 3: Verify the PDF visually**

Download the guide, confirm the `%PDF-` signature, render every page with the bundled PDF workflow, and inspect for clipping, overlap, broken pagination, missing chart labels, and unreadable contrast.

- [x] **Step 4: Confirm privacy behaviour**

Inspect browser network activity during calculation and download. Confirm birthplace autocomplete is the only request containing entered location text and that PDF generation sends no birth details or chart data.

- [x] **Step 5: Complete and commit the plan record**

Mark completed checkboxes, then:

```bash
git add docs/superpowers/plans/2026-09-12-birth-chart-reading-and-pdf.md
git commit -m "docs: complete birth chart guide plan"
```
