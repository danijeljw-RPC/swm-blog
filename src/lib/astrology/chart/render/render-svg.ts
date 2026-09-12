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
    const placedLongitudes: number[] = [];

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

    const houseNumbers = chart.houses
        .map((house, index) => {
            const next = chart.houses[(index + 1) % chart.houses.length];
            const span = ((next.longitude - house.longitude + 360) % 360) / 2;
            const p = polarToCartesian(house.longitude + span, 415, center, center);
            return `<text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" class="house-number">${house.house}</text>`;
        })
        .join("");

    const planets = chart.planets
        .map(planet => {
            const nearby = placedLongitudes.filter(longitude => {
                const difference = Math.abs(longitude - planet.longitude) % 360;
                return Math.min(difference, 360 - difference) < 9;
            }).length;
            placedLongitudes.push(planet.longitude);
            const displayRadii = [planetRadius, 385, 295];
            const displayRadius = displayRadii[nearby % displayRadii.length];
            const p = polarToCartesian(
                planet.longitude,
                displayRadius,
                center,
                center
            );
            const anchor = polarToCartesian(planet.longitude, planetRadius, center, center);

            return `
                <g class="planet-position">
                    ${displayRadius === planetRadius ? "" : `<line x1="${anchor.x}" y1="${anchor.y}" x2="${p.x}" y2="${p.y}" class="planet-guide" />`}
                    <circle cx="${p.x}" cy="${p.y}" r="24" class="planet-marker" />
                    <text x="${p.x}" y="${p.y}" text-anchor="middle" dominant-baseline="middle" class="planet">${glyphs[planet.name]}</text>
                </g>
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
            aria-label="Natal chart wheel. The adjacent chart legend and written interpretation describe its symbols, houses, and aspect lines."
        >
            <circle
                cx="${center}"
                cy="${center}"
                r="${zodiacRadius}"
                class="zodiac-outer"
            />

            <circle cx="${center}" cy="${center}" r="${aspectRadius}" class="aspect-inner" />

            ${houses}
            ${houseNumbers}
            ${aspects}
            ${planets}
        </svg>
    `;
}
