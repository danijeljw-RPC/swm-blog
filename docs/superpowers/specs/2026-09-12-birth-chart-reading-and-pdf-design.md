# Birth Chart Reading and PDF Design

## Goal

Turn the existing technically correct birth-chart result into an approachable reading for people who do not already know astrological notation, and let them keep the same reading as a downloadable PDF.

The feature remains a symbolic and reflective astrology experience. It does not present personality statements as scientific facts, and it does not send or persist birth details.

## User experience

After a successful calculation, the result appears in this order:

1. A **Your chart at a glance** panel highlighting the Sun, Moon, Ascendant, and Midheaven with their signs, degrees, and short plain-language roles.
2. The existing chart wheel, enhanced with a visible legend explaining planet symbols, house divisions, and harmonious/challenging aspect colours.
3. A **Planet placements** section. Each entry explains the planet as the part of life being described, the sign as its style of expression, and the house as the life area in which it appears.
4. A **Major aspects** section ordered by tightest orb first, with a short explanation of each aspect type. A compact empty state is shown when no supported major aspects are found.
5. A **Technical details** disclosure containing the exact placement table, UTC instant, birthplace, house system, and calculation terminology.
6. A **Download your chart guide** button that creates a PDF locally in the browser.

The initial result prioritises interpretation and progressive disclosure. Technical information remains available without dominating the reading.

## Interpretation model

Interpretations are deterministic and assembled from repository-owned reference data:

- Planet role and meaning come from `src/data/astrological/astrological-metaphysical-reference.json`.
- Sign meaning, element, themes, and metaphysical interpretation come from the same reference file.
- A small, explicit house-meaning dictionary supplies the twelve life-area descriptions.
- A small, explicit aspect-meaning dictionary supplies neutral descriptions for conjunction, sextile, square, trine, and opposition.

Generated copy combines these sources with templates rather than using an external service or generative AI. The copy uses possibility language such as “may,” “can,” and “invites reflection,” avoids predictions, and presents balanced or challenging themes without declaring fixed traits.

Sun, Moon, Ascendant, and Midheaven receive prominence because they provide the clearest entry point for a new reader. Chiron and outer planets remain available in the complete placement list.

## Components and data flow

`calculateBirthChart` remains the source of astronomical positions. New presentation helpers accept its `BirthChart` result and return a typed reading model containing:

- the four headline placements;
- ordered planet interpretations;
- ordered aspect interpretations;
- legend entries;
- technical metadata.

The browser controller performs this flow after calculation:

```text
BirthChart
  -> buildBirthChartReading
  -> render accessible on-page result
  -> retain the same reading model for PDF generation
```

The PDF generator receives the reading model, rendered chart SVG, and entered local birth date/time. It creates the document entirely in the browser and triggers a download. No server endpoint, database write, analytics payload, or retained browser storage is introduced.

## PDF contents

The downloadable guide contains:

- Sisters with Mirrors title treatment and “Birth Chart Guide” heading;
- entered local birth date/time and selected birthplace;
- chart wheel image;
- Sun, Moon, Ascendant, and Midheaven overview;
- all planet placement interpretations;
- major aspects ordered by orb;
- compact legend and glossary;
- technical calculation notes and reflective-tradition disclaimer;
- a link back to the Birth Chart page.

The filename uses only a normalised place name and date, for example `birth-chart-adelaide-1990-01-01.pdf`. The PDF excludes exact coordinates and the internal place database identifier because readers do not need them.

## Accessibility and responsive behaviour

- The chart SVG receives a descriptive accessible name and the adjacent legend makes its visual encoding understandable without relying on colour alone.
- Tables retain proper headers; interpretation sections use semantic headings and lists.
- The download button appears only after a successful result exists and exposes a busy state while generating.
- Generated sections fit a single mobile column and become a wider reading layout at desktop breakpoints.
- PDF pagination avoids splitting headings from their first paragraph and repeats page numbering/footer context.

## Failure handling

- Chart calculation errors continue to use the existing alert region.
- If PDF generation fails, the on-page chart remains intact and an actionable error appears in the same alert region.
- The download button is re-enabled after success or failure.
- Missing reference content falls back to exact placement facts rather than fabricating an interpretation.

## Testing and verification

Automated tests cover:

- deterministic headline, planet, house, and aspect interpretation models;
- aspect ordering by orb;
- fallback behaviour for missing reference content;
- safe PDF filename generation;
- PDF output beginning with a valid PDF signature and containing more than one page for a representative full chart;
- required Birth Chart page controls, legend, headings, and disclaimer;
- existing chart calculations and all current repository tests.

Manual verification covers desktop and mobile rendering, chart and legend readability, PDF download, PDF pagination, and confirmation that no birth details leave the browser except the existing birthplace autocomplete query.

## Scope boundaries

This slice does not add accounts, saved charts, chart comparison, transit forecasts, AI-written readings, email delivery, or server-side PDF storage. It does not change the astronomical calculation model or supported aspect/orb definitions.
