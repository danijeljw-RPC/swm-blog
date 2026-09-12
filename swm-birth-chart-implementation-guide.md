# Sisters with Mirrors — Birth Chart / Natal Chart Implementation Guide

## Known Cloudflare D1 details

Use these values in the Astro/Cloudflare project:

```text
D1 database name: swm-places
D1 binding:       swm_places
D1 database ID:   6febf594-c805-4099-8a42-529eac23e571
```

The runtime application does **not** need the Cloudflare Account ID or GitHub Actions API token to read the database. It only needs the D1 binding.

The current `places` table is:

```sql
CREATE TABLE places (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    ascii_name TEXT NOT NULL,
    alternate_names TEXT,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    country_code TEXT NOT NULL,
    country TEXT NOT NULL,
    region TEXT,
    population INTEGER NOT NULL DEFAULT 0,
    timezone TEXT NOT NULL
);
```

The GeoNames source is refreshed weekly by GitHub Actions.

---

# 1. Recommended architecture

```text
Birthplace text
    ↓
Astro API endpoint
    ↓
Cloudflare D1 / swm-places
    ↓
Selected place:
  latitude
  longitude
  IANA timezone
    ↓
Birth date + local birth time
    ↓
Historical timezone conversion
    ↓
UTC instant
    ↓
Swiss Ephemeris
    ↓
Planets + houses + ASC + MC
    ↓
Aspect calculation
    ↓
BirthChart object
    ↓
SVG renderer
```

Recommended split:

- D1 lookup happens server-side in Astro/Cloudflare.
- Browser JavaScript calls your own `/api/places` endpoint.
- Swiss Ephemeris chart calculation runs using the WebAssembly/browser package.
- SVG is the canonical chart output.
- Do not expose D1 directly to browser code.

This removes the need for Google Places, Mapbox, timezone APIs, astrology APIs, and chart APIs.

---

# 2. `wrangler.jsonc`

Add the existing D1 database to the Astro project:

```json
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "swm-blog",
  "main": "@astrojs/cloudflare/entrypoints/server",
  "compatibility_date": "2026-09-12",
  "d1_databases": [
    {
      "binding": "swm_places",
      "database_name": "swm-places",
      "database_id": "6febf594-c805-4099-8a42-529eac23e571",
      "remote": true
    }
  ]
}
```

`remote: true` is recommended for this binding during development because `swm-places` is reference data and the website should treat it as read-only. Local development can query the real populated D1 database instead of maintaining another 38 MB copy.

The GeoNames updater should remain the only process that modifies this database.

---

# 3. Generate Cloudflare binding types

Run:

```bash
npx wrangler types
```

This creates `worker-configuration.d.ts`.

Ensure TypeScript loads it:

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "types": [
      "./worker-configuration.d.ts"
    ]
  }
}
```

The generated environment should include a D1 binding equivalent to:

```ts
interface Env {
    swm_places: D1Database;
}
```

---

# 4. Commands to inspect the existing D1 database

These are useful when giving the database details to Codex or debugging the project.

## Database information

```bash
npx wrangler d1 info swm-places
```

## Table schema

```bash
npx wrangler d1 execute swm-places \
  --remote \
  --command="SELECT sql FROM sqlite_schema WHERE type='table' AND name='places';"
```

## Columns

```bash
npx wrangler d1 execute swm-places \
  --remote \
  --command="PRAGMA table_info(places);"
```

## Adelaide sample

```bash
npx wrangler d1 execute swm-places \
  --remote \
  --command="
    SELECT
      id,
      name,
      region,
      country,
      latitude,
      longitude,
      timezone,
      population
    FROM places
    WHERE ascii_name = 'Adelaide'
    ORDER BY population DESC
    LIMIT 10;
  "
```

## Autocomplete-style test

```bash
npx wrangler d1 execute swm-places \
  --remote \
  --command="
    SELECT
      id,
      name,
      region,
      country,
      latitude,
      longitude,
      timezone,
      population
    FROM places
    WHERE ascii_name LIKE 'Adel%'
    ORDER BY population DESC
    LIMIT 10;
  "
```

If those commands work but your Astro endpoint does not, D1 itself is fine and the issue is in the application's binding/configuration.

---

# 5. Location types

Create:

```text
src/lib/astrology/location/types.ts
```

```ts
export interface PlaceSearchResult {
    id: number;
    name: string;
    region: string | null;
    country: string;
    countryCode: string;

    latitude: number;
    longitude: number;

    timezone: string;
    population: number;
}
```

---

# 6. Astro location API

Current Astro 6 + Cloudflare uses direct Worker bindings:

```ts
import { env } from "cloudflare:workers";
```

Create:

```text
src/pages/api/places.ts
```

```ts
import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

interface PlaceRow {
    id: number;
    name: string;
    region: string | null;
    country: string;
    country_code: string;
    latitude: number;
    longitude: number;
    timezone: string;
    population: number;
}

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
        return Response.json([]);
    }

    const search = query.slice(0, 100);
    const prefix = `${search}%`;

    const result = await env.swm_places
        .prepare(`
            SELECT
                id,
                name,
                region,
                country,
                country_code,
                latitude,
                longitude,
                timezone,
                population
            FROM places
            WHERE
                ascii_name LIKE ?1 COLLATE NOCASE
                OR name LIKE ?1 COLLATE NOCASE
            ORDER BY
                CASE
                    WHEN ascii_name = ?2 COLLATE NOCASE THEN 0
                    WHEN name = ?2 COLLATE NOCASE THEN 0
                    ELSE 1
                END,
                population DESC,
                name ASC
            LIMIT 10
        `)
        .bind(prefix, search)
        .all<PlaceRow>();

    return Response.json(
        result.results.map(row => ({
            id: row.id,
            name: row.name,
            region: row.region,
            country: row.country,
            countryCode: row.country_code,
            latitude: row.latitude,
            longitude: row.longitude,
            timezone: row.timezone,
            population: row.population
        })),
        {
            headers: {
                "Cache-Control": "public, max-age=300"
            }
        }
    );
};
```

Example:

```text
GET /api/places?q=adel
```

The Australian Adelaide should appear before the South African Adelaide because results are ordered primarily by population.

---

# 7. Browser autocomplete

```ts
import type { PlaceSearchResult } from "./types";

export async function searchPlaces(
    query: string,
    signal?: AbortSignal
): Promise<PlaceSearchResult[]> {
    const value = query.trim();

    if (value.length < 2) {
        return [];
    }

    const response = await fetch(
        `/api/places?q=${encodeURIComponent(value)}`,
        { signal }
    );

    if (!response.ok) {
        throw new Error(`Place lookup failed: ${response.status}`);
    }

    return await response.json() as PlaceSearchResult[];
}
```

Recommended UI behaviour:

- start searching after 2 characters
- debounce by about 250 ms
- cancel previous requests using `AbortController`
- display `name, region, country`
- store the complete selected result, not just the label

For natal-chart calculations the important selected values are:

```text
latitude
longitude
timezone
```

---

# 8. User-facing birth-chart form

The user should provide only:

```text
Date of birth
Time of birth
Place of birth
```

Example:

```text
Date of birth
[ 12 / 09 / 1985 ]

Time of birth
[ 14 : 37 ]

Place of birth
[ Adelaide, South Australia, Australia ]

[ Generate Birth Chart ]
```

Model:

```ts
export interface BirthChartInput {
    date: string; // YYYY-MM-DD
    time: string; // HH:mm

    place: {
        id: number;
        name: string;
        region: string | null;
        country: string;

        latitude: number;
        longitude: number;
        timezone: string;
    };
}
```

Later you can add:

```ts
timeKnown: boolean;
```

If birth time is unknown, do not claim reliable Ascendant, Midheaven, houses, or house placements.

---

# 9. Install astrology dependencies

For an Astro site deployed to Cloudflare Workers, install:

```bash
npm install @swisseph/browser @js-temporal/polyfill
```

Use:

```text
@swisseph/browser
```

for Swiss Ephemeris calculations.

Do not use `@swisseph/node` inside Cloudflare Worker runtime code. That package uses a native Node addon; Astro on-demand Cloudflare routes run in `workerd`.

---

# 10. Swiss Ephemeris licensing

The current `@swisseph/browser` / `@swisseph/node` project advertises an AGPL-3.0 licence, following Swiss Ephemeris' open-source licensing path.

Before production release, decide whether those licence obligations are acceptable.

If they are not, investigate the professional/commercial Swiss Ephemeris licence from Astrodienst before shipping.

This is a licensing consideration rather than a technical limitation.

---

# 11. Convert birth time to UTC

GeoNames gives you an IANA timezone such as:

```text
Australia/Adelaide
```

Do not convert it into a stored fixed offset such as:

```text
+09:30
```

Historical daylight-saving and timezone rules matter.

Create:

```text
src/lib/astrology/time/to-utc.ts
```

```ts
import { Temporal } from "@js-temporal/polyfill";

export interface LocalBirthDateTime {
    date: string;
    time: string;
    timezone: string;
}

export function birthTimeToUtc({
    date,
    time,
    timezone
}: LocalBirthDateTime): Date {
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);

    const zonedDateTime = Temporal.ZonedDateTime.from({
        timeZone: timezone,
        year,
        month,
        day,
        hour,
        minute,
        second: 0
    });

    return new Date(
        Number(zonedDateTime.toInstant().epochMilliseconds)
    );
}
```

---

# 12. Julian Day helper

```text
src/lib/astrology/ephemeris/julian-day.ts
```

```ts
export function decimalUtcHour(date: Date): number {
    return (
        date.getUTCHours()
        + date.getUTCMinutes() / 60
        + date.getUTCSeconds() / 3600
        + date.getUTCMilliseconds() / 3_600_000
    );
}
```

Then:

```ts
const jd = swe.julianDay(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth() + 1,
    utcDate.getUTCDate(),
    decimalUtcHour(utcDate)
);
```

---

# 13. Zodiac conversion

```text
src/lib/astrology/zodiac.ts
```

```ts
export const zodiacSigns = [
    "Aries",
    "Taurus",
    "Gemini",
    "Cancer",
    "Leo",
    "Virgo",
    "Libra",
    "Scorpio",
    "Sagittarius",
    "Capricorn",
    "Aquarius",
    "Pisces"
] as const;

export type ZodiacSign = typeof zodiacSigns[number];

export function normalizeLongitude(longitude: number): number {
    return ((longitude % 360) + 360) % 360;
}

export function longitudeToZodiac(longitude: number) {
    const normalized = normalizeLongitude(longitude);

    const signIndex = Math.floor(normalized / 30);
    const decimalDegree = normalized % 30;

    const degree = Math.floor(decimalDegree);
    const minutesDecimal = (decimalDegree - degree) * 60;
    const minute = Math.floor(minutesDecimal);
    const second = Math.round((minutesDecimal - minute) * 60);

    return {
        sign: zodiacSigns[signIndex],
        signIndex,
        longitude: normalized,
        decimalDegree,
        degree,
        minute,
        second
    };
}
```

---

# 14. Initialise Swiss Ephemeris once

```text
src/lib/astrology/ephemeris/create-ephemeris.ts
```

```ts
import { SwissEphemeris } from "@swisseph/browser";

let instance: Promise<SwissEphemeris> | undefined;

export function getSwissEphemeris(): Promise<SwissEphemeris> {
    instance ??= (async () => {
        const swe = new SwissEphemeris();
        await swe.init();
        return swe;
    })();

    return instance;
}
```

---

# 15. Chart domain model

```text
src/lib/astrology/chart/types.ts
```

```ts
import type { ZodiacSign } from "../zodiac";

export type PlanetName =
    | "Sun"
    | "Moon"
    | "Mercury"
    | "Venus"
    | "Mars"
    | "Jupiter"
    | "Saturn"
    | "Uranus"
    | "Neptune"
    | "Pluto"
    | "Chiron";

export interface ChartPoint {
    longitude: number;
    sign: ZodiacSign;
    degree: number;
    minute: number;
    second: number;
}

export interface PlanetPosition extends ChartPoint {
    name: PlanetName;
    latitude: number;
    distance: number;
    house?: number;
}

export interface HouseCusp extends ChartPoint {
    house: number;
}

export type AspectName =
    | "Conjunction"
    | "Sextile"
    | "Square"
    | "Trine"
    | "Opposition";

export interface Aspect {
    from: PlanetName;
    to: PlanetName;
    type: AspectName;
    exactAngle: number;
    actualAngle: number;
    orb: number;
}

export interface BirthChart {
    julianDay: number;
    planets: PlanetPosition[];
    houses: HouseCusp[];
    ascendant: ChartPoint;
    midheaven: ChartPoint;
    aspects: Aspect[];

    birthplace: {
        id: number;
        name: string;
        region: string | null;
        country: string;
        latitude: number;
        longitude: number;
        timezone: string;
    };

    birthTimeUtc: string;
}
```

---

# 16. Calculate aspects

```text
src/lib/astrology/chart/calculate-aspects.ts
```

```ts
import type {
    Aspect,
    AspectName,
    PlanetPosition
} from "./types";

interface AspectDefinition {
    type: AspectName;
    angle: number;
    orb: number;
}

const definitions: AspectDefinition[] = [
    { type: "Conjunction", angle: 0, orb: 8 },
    { type: "Sextile", angle: 60, orb: 6 },
    { type: "Square", angle: 90, orb: 8 },
    { type: "Trine", angle: 120, orb: 8 },
    { type: "Opposition", angle: 180, orb: 8 }
];

function angularDistance(a: number, b: number): number {
    const difference = Math.abs(a - b) % 360;
    return Math.min(difference, 360 - difference);
}

export function calculateAspects(
    planets: PlanetPosition[]
): Aspect[] {
    const result: Aspect[] = [];

    for (let i = 0; i < planets.length; i++) {
        for (let j = i + 1; j < planets.length; j++) {
            const a = planets[i];
            const b = planets[j];

            const actualAngle = angularDistance(
                a.longitude,
                b.longitude
            );

            for (const definition of definitions) {
                const orb = Math.abs(
                    actualAngle - definition.angle
                );

                if (orb <= definition.orb) {
                    result.push({
                        from: a.name,
                        to: b.name,
                        type: definition.type,
                        exactAngle: definition.angle,
                        actualAngle,
                        orb
                    });

                    break;
                }
            }
        }
    }

    return result;
}
```

Orb rules can become configurable later.

---

# 17. Determine a planet's house

```text
src/lib/astrology/chart/find-house.ts
```

```ts
import { normalizeLongitude } from "../zodiac";

function between(
    longitude: number,
    start: number,
    end: number
): boolean {
    const value = normalizeLongitude(longitude);
    const from = normalizeLongitude(start);
    const to = normalizeLongitude(end);

    if (from <= to) {
        return value >= from && value < to;
    }

    return value >= from || value < to;
}

export function findHouse(
    longitude: number,
    cusps: number[]
): number {
    for (let house = 1; house <= 12; house++) {
        const next = house === 12 ? 1 : house + 1;

        if (between(
            longitude,
            cusps[house],
            cusps[next]
        )) {
            return house;
        }
    }

    throw new Error(
        `Unable to determine house for longitude ${longitude}`
    );
}
```

---

# 18. Calculate the birth chart

```text
src/lib/astrology/chart/calculate-birth-chart.ts
```

```ts
import {
    Asteroid,
    HouseSystem,
    Planet
} from "@swisseph/browser";

import { birthTimeToUtc } from "../time/to-utc";
import { decimalUtcHour } from "../ephemeris/julian-day";
import { getSwissEphemeris } from "../ephemeris/create-ephemeris";
import { longitudeToZodiac } from "../zodiac";
import { calculateAspects } from "./calculate-aspects";
import { findHouse } from "./find-house";

import type {
    BirthChart,
    PlanetName,
    PlanetPosition
} from "./types";

export interface BirthChartRequest {
    date: string;
    time: string;

    place: {
        id: number;
        name: string;
        region: string | null;
        country: string;
        latitude: number;
        longitude: number;
        timezone: string;
    };
}

export async function calculateBirthChart(
    request: BirthChartRequest
): Promise<BirthChart> {
    const swe = await getSwissEphemeris();

    const utcDate = birthTimeToUtc({
        date: request.date,
        time: request.time,
        timezone: request.place.timezone
    });

    const jd = swe.julianDay(
        utcDate.getUTCFullYear(),
        utcDate.getUTCMonth() + 1,
        utcDate.getUTCDate(),
        decimalUtcHour(utcDate)
    );

    const bodies: Array<{
        name: PlanetName;
        body: Planet | Asteroid;
    }> = [
        { name: "Sun", body: Planet.Sun },
        { name: "Moon", body: Planet.Moon },
        { name: "Mercury", body: Planet.Mercury },
        { name: "Venus", body: Planet.Venus },
        { name: "Mars", body: Planet.Mars },
        { name: "Jupiter", body: Planet.Jupiter },
        { name: "Saturn", body: Planet.Saturn },
        { name: "Uranus", body: Planet.Uranus },
        { name: "Neptune", body: Planet.Neptune },
        { name: "Pluto", body: Planet.Pluto },
        { name: "Chiron", body: Asteroid.Chiron }
    ];

    const houses = swe.calculateHouses(
        jd,
        request.place.latitude,
        request.place.longitude,
        HouseSystem.Placidus
    );

    const houseCusps = Array.from(
        { length: 12 },
        (_, index) => {
            const house = index + 1;
            const zodiac = longitudeToZodiac(
                houses.cusps[house]
            );

            return {
                house,
                ...zodiac
            };
        }
    );

    const planets: PlanetPosition[] = bodies.map(
        ({ name, body }) => {
            const position = swe.calculatePosition(jd, body);
            const zodiac = longitudeToZodiac(
                position.longitude
            );

            return {
                name,
                longitude: position.longitude,
                latitude: position.latitude,
                distance: position.distance,
                sign: zodiac.sign,
                degree: zodiac.degree,
                minute: zodiac.minute,
                second: zodiac.second,
                house: findHouse(
                    position.longitude,
                    houses.cusps
                )
            };
        }
    );

    const asc = longitudeToZodiac(houses.ascendant);
    const mc = longitudeToZodiac(houses.mc);

    return {
        julianDay: jd,
        planets,
        houses: houseCusps,

        ascendant: {
            longitude: houses.ascendant,
            sign: asc.sign,
            degree: asc.degree,
            minute: asc.minute,
            second: asc.second
        },

        midheaven: {
            longitude: houses.mc,
            sign: mc.sign,
            degree: mc.degree,
            minute: mc.minute,
            second: mc.second
        },

        aspects: calculateAspects(planets),
        birthplace: request.place,
        birthTimeUtc: utcDate.toISOString()
    };
}
```

Follow the installed package's TypeScript declarations if the exact enum/signature for Chiron differs in the installed `@swisseph/browser` version.

---

# 19. SVG coordinate helper

```text
src/lib/astrology/chart/render/coordinates.ts
```

```ts
export interface Point {
    x: number;
    y: number;
}

export function polarToCartesian(
    longitude: number,
    radius: number,
    centerX: number,
    centerY: number
): Point {
    const radians = (longitude - 90) * Math.PI / 180;

    return {
        x: centerX + radius * Math.cos(radians),
        y: centerY + radius * Math.sin(radians)
    };
}
```

---

# 20. SVG renderer skeleton

The renderer should consume the same `BirthChart` object used by the written interpretation.

It should render:

- zodiac wheel
- 12 zodiac sectors
- 12 house lines
- planet glyphs
- Ascendant
- Midheaven
- aspect lines

Example skeleton:

```ts
import type { BirthChart } from "../types";
import { polarToCartesian } from "./coordinates";

const glyphs: Record<string, string> = {
    Sun: "☉",
    Moon: "☽",
    Mercury: "☿",
    Venus: "♀",
    Mars: "♂",
    Jupiter: "♃",
    Saturn: "♄",
    Uranus: "♅",
    Neptune: "♆",
    Pluto: "♇",
    Chiron: "⚷"
};

export function renderBirthChartSvg(
    chart: BirthChart
): string {
    const size = 1000;
    const center = 500;

    const zodiacRadius = 450;
    const planetRadius = 340;
    const aspectRadius = 250;

    const houses = chart.houses
        .map(house => {
            const p = polarToCartesian(
                house.longitude,
                zodiacRadius,
                center,
                center
            );

            return `
                <line
                    x1="${center}"
                    y1="${center}"
                    x2="${p.x}"
                    y2="${p.y}"
                    class="house-line"
                />
            `;
        })
        .join("");

    const planets = chart.planets
        .map(planet => {
            const p = polarToCartesian(
                planet.longitude,
                planetRadius,
                center,
                center
            );

            return `
                <text
                    x="${p.x}"
                    y="${p.y}"
                    text-anchor="middle"
                    dominant-baseline="middle"
                    class="planet"
                >${glyphs[planet.name]}</text>
            `;
        })
        .join("");

    const byName = new Map(
        chart.planets.map(p => [p.name, p])
    );

    const aspects = chart.aspects
        .map(aspect => {
            const from = byName.get(aspect.from);
            const to = byName.get(aspect.to);

            if (!from || !to) {
                return "";
            }

            const a = polarToCartesian(
                from.longitude,
                aspectRadius,
                center,
                center
            );

            const b = polarToCartesian(
                to.longitude,
                aspectRadius,
                center,
                center
            );

            return `
                <line
                    x1="${a.x}"
                    y1="${a.y}"
                    x2="${b.x}"
                    y2="${b.y}"
                    data-aspect="${aspect.type}"
                    class="aspect aspect-${aspect.type.toLowerCase()}"
                />
            `;
        })
        .join("");

    return `
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 ${size} ${size}"
            role="img"
            aria-label="Natal chart"
        >
            <circle
                cx="${center}"
                cy="${center}"
                r="${zodiacRadius}"
                class="zodiac-outer"
            />

            ${houses}
            ${aspects}
            ${planets}
        </svg>
    `;
}
```

Use CSS/SVG styling later for the Sisters with Mirrors visual design.

---

# 21. Suggested project structure

```text
src/
├── lib/
│   └── astrology/
│       ├── location/
│       │   ├── types.ts
│       │   └── search.ts
│       ├── time/
│       │   └── to-utc.ts
│       ├── ephemeris/
│       │   ├── create-ephemeris.ts
│       │   └── julian-day.ts
│       ├── chart/
│       │   ├── types.ts
│       │   ├── calculate-birth-chart.ts
│       │   ├── calculate-aspects.ts
│       │   ├── find-house.ts
│       │   └── render/
│       │       ├── coordinates.ts
│       │       └── render-svg.ts
│       └── zodiac.ts
├── pages/
│   └── api/
│       └── places.ts
└── components/
    └── astrology/
        ├── BirthChartForm.astro
        ├── PlaceAutocomplete.ts
        └── NatalChart.ts
```

---

# 22. Full flow

```ts
const places = await searchPlaces("adel");

const selectedPlace = places[0];

const chart = await calculateBirthChart({
    date: "1985-09-12",
    time: "14:37",
    place: selectedPlace
});

const svg = renderBirthChartSvg(chart);
```

The `BirthChart` object should also drive the written interpretation.

For example:

```text
Sun in Virgo
Moon in ...
Scorpio Rising

Sun trine Moon
Mars square Saturn
...
```

Do not independently recalculate astrology for the interpretation layer.

---

# 23. What D1 contributes

For a selected birthplace D1 gives:

```ts
{
    latitude: -34.92866,
    longitude: 138.59863,
    timezone: "Australia/Adelaide"
}
```

Purpose:

- latitude → houses and Ascendant
- longitude → houses and Ascendant
- timezone → correct conversion of historical local birth time to UTC

Keep the IANA timezone string.

---

# 24. If charts are saved later

Store the original input and the resolved location:

```ts
interface StoredBirthChartInput {
    date: string;
    time: string;

    placeId: number;
    placeName: string;
    region: string | null;
    country: string;

    latitude: number;
    longitude: number;
    timezone: string;
}
```

Do not save only the GeoNames ID. Also save the resolved coordinates/timezone used for that chart, so a future GeoNames update cannot silently change an existing saved chart.

---

# 25. What to give Codex / another project session

Use this handoff:

```text
Cloudflare D1 location database

Database:
  swm-places

Binding:
  swm_places

Database ID:
  6febf594-c805-4099-8a42-529eac23e571

Table:
  places

Columns:
  id INTEGER PRIMARY KEY
  name TEXT NOT NULL
  ascii_name TEXT NOT NULL
  alternate_names TEXT
  latitude REAL NOT NULL
  longitude REAL NOT NULL
  country_code TEXT NOT NULL
  country TEXT NOT NULL
  region TEXT
  population INTEGER NOT NULL
  timezone TEXT NOT NULL

The database contains GeoNames cities500 data and is refreshed
weekly by GitHub Actions.

The web application must treat it as read-only.

For current Astro 6 + Cloudflare use:
  import { env } from "cloudflare:workers"

D1 binding:
  env.swm_places

Implement:
  GET /api/places?q=<query>

Return:
  id
  name
  region
  country
  countryCode
  latitude
  longitude
  timezone
  population

Order autocomplete results primarily by population.

Selected location supplies:
  latitude
  longitude
  IANA timezone

Those values feed the natal-chart calculation.
```

---

# 26. Recommended implementation phases

## Phase 1 — D1

Add the binding and prove this works:

```ts
await env.swm_places
    .prepare("SELECT COUNT(*) AS count FROM places")
    .first();
```

## Phase 2 — Search API

Implement:

```text
GET /api/places?q=adel
```

## Phase 3 — Autocomplete

Display:

```text
Adelaide, South Australia, Australia
Adelaide, Eastern Cape, South Africa
```

## Phase 4 — Time conversion

Implement:

```text
birth date
+ birth local time
+ IANA timezone
-> UTC instant
```

## Phase 5 — Swiss Ephemeris

Calculate:

- Sun
- Moon
- Mercury
- Venus
- Mars
- Jupiter
- Saturn
- Uranus
- Neptune
- Pluto
- Chiron
- Ascendant
- Midheaven
- 12 house cusps

Start with Placidus.

## Phase 6 — Aspects

Implement:

- conjunction
- sextile
- square
- trine
- opposition

## Phase 7 — SVG

Render from the same `BirthChart` object.

## Phase 8 — Interpretations

Join calculated chart data to the existing Sisters with Mirrors zodiac/planet/element content.

---

# 27. Acceptance checks

Before considering this complete:

### Location

Searching `Adel` returns Australian Adelaide before South African Adelaide.

Australian Adelaide should return approximately:

```text
region:     South Australia
country:    Australia
timezone:   Australia/Adelaide
latitude:   -34.93
longitude:  138.60
```

### Time

Use `Australia/Adelaide`, not a hard-coded offset.

### Planets

A fixed UTC test instant should produce stable planetary longitudes.

### Houses

Changing birth time should change the Ascendant, MC, and house cusps.

### Location

Changing birthplace while keeping the same UTC instant should change house calculations.

### Aspects

Each result contains:

```text
from
to
type
exact angle
actual angle
orb
```

### SVG

The same `BirthChart` object should always produce the same SVG.

---

# 28. Later improvements

Do these only after the basic system works.

## Alternate-name search

The database already contains `alternate_names`.

If searches such as:

```text
Firenze -> Florence
München -> Munich
```

need better support, add an FTS search table later.

Do not run a full substring scan over `alternate_names` on every autocomplete keystroke.

## House systems

Start with Placidus.

Later optionally offer:

```text
Placidus
Whole Sign
Equal House
Koch
Campanus
Regiomontanus
```

## Unknown birth time

Provide a reduced chart without claiming:

```text
Ascendant
Midheaven
houses
```

## Exports

Keep SVG as canonical output.

Later convert it to PNG/WebP/PDF if required.

---

# 29. Current runtime/package assumptions

This guide is based on the current 2026 APIs:

- Cloudflare D1 is accessed through a configured Worker binding.
- `remote: true` can connect local development to the deployed D1 database.
- Astro 6 Cloudflare code accesses bindings with `import { env } from "cloudflare:workers"`.
- `wrangler types` generates binding/runtime TypeScript declarations.
- `@swisseph/node` uses native Node bindings.
- `@swisseph/browser` is the WebAssembly/browser package.
- Swiss Ephemeris JS supports planetary positions and house calculations including Placidus.
- The Swiss Ephemeris JS project currently advertises AGPL-3.0 licensing.

Re-check package APIs and licensing when doing major dependency upgrades.
