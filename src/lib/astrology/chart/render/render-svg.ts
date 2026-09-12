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
