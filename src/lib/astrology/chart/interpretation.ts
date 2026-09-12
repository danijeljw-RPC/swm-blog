import referenceData from "../../../data/astrological/astrological-metaphysical-reference.json";
import type { AspectName, BirthChart, ChartPoint, PlanetName } from "./types";

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

const houseMeanings = [
    "identity, beginnings, and how you meet the world",
    "values, resources, security, and self-worth",
    "learning, communication, siblings, and your immediate environment",
    "home, family, roots, and emotional foundations",
    "creativity, pleasure, romance, and self-expression",
    "daily routines, service, craft, and wellbeing",
    "partnership, cooperation, and one-to-one relationships",
    "intimacy, shared resources, transformation, and trust",
    "belief, higher learning, travel, and the search for meaning",
    "vocation, public life, responsibility, and contribution",
    "friendship, community, collective hopes, and belonging",
    "rest, the unconscious, retreat, and spiritual integration"
] as const;

const aspectMeanings: Record<AspectName, string> = {
    Conjunction: "These energies meet directly and tend to act as one concentrated theme.",
    Sextile: "These energies can support one another through opportunities that benefit from conscious use.",
    Square: "These energies create productive friction that may call for adjustment, effort, and growth.",
    Trine: "These energies tend to cooperate naturally and may feel like an available strength.",
    Opposition: "These energies pull across a polarity and invite balance, awareness, and integration."
};

const aspectSymbols: Record<AspectName, string> = {
    Conjunction: "☌", Sextile: "⚹", Square: "□", Trine: "△", Opposition: "☍"
};

const planetSymbols: Record<PlanetName, string> = {
    Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃",
    Saturn: "♄", Uranus: "♅", Neptune: "♆", Pluto: "♇", Chiron: "⚷"
};

export function formatChartPoint(point: Pick<ChartPoint, "degree" | "minute" | "sign">): string {
    return `${point.degree}°${point.minute.toString().padStart(2, "0")}' ${point.sign}`;
}

function headline(label: string, point: ChartPoint, meaning: string) {
    return { label, position: formatChartPoint(point), meaning };
}

export function buildBirthChartReading(chart: BirthChart): BirthChartReading {
    const planets = referenceData.planets as Record<string, { astrological_role: string; metaphysical_interpretation: string }>;
    const signs = referenceData.zodiac_signs as Record<string, { name: string; metaphysical_interpretation: string }>;
    const byName = new Map(chart.planets.map(planet => [planet.name, planet]));
    const sun = byName.get("Sun");
    const moon = byName.get("Moon");

    const headlines = [
        ...(sun ? [headline("Sun", sun, "Your core identity, vitality, purpose, and conscious self-expression.")] : []),
        ...(moon ? [headline("Moon", moon, "Your emotional needs, instincts, inner life, and patterns of care.")] : []),
        headline("Ascendant", chart.ascendant, "How you meet the world and the first impression through which life approaches you."),
        headline("Midheaven", chart.midheaven, "Your public direction, vocation, contribution, and developing reputation.")
    ];

    const placements = chart.planets.map(planet => {
        const position = formatChartPoint(planet);
        const houseLabel = planet.house ? `House ${planet.house}` : "House unavailable";
        const planetReference = planets[planet.name.toLowerCase()];
        const signReference = signs[planet.sign.toLowerCase()];
        if (!planetReference || !signReference || !planet.house || !houseMeanings[planet.house - 1]) {
            return {
                name: planet.name,
                symbol: planetSymbols[planet.name],
                position,
                houseLabel,
                role: planetReference?.astrological_role ?? "Placement",
                interpretation: `${planet.name} is at ${position} in ${houseLabel}.`
            };
        }

        return {
            name: planet.name,
            symbol: planetSymbols[planet.name],
            position,
            houseLabel,
            role: planetReference.astrological_role,
            interpretation: `${planet.name} describes ${planetReference.astrological_role.toLowerCase()}. In ${signReference.name}, this may be expressed through the sign's invitation: ${signReference.metaphysical_interpretation} In House ${planet.house}, attention turns toward ${houseMeanings[planet.house - 1]}.`
        };
    });

    const aspects = chart.aspects
        .map(aspect => ({
            symbol: aspectSymbols[aspect.type],
            label: `${aspect.from} ${aspect.type.toLowerCase()} ${aspect.to}`,
            orb: aspect.orb,
            interpretation: aspectMeanings[aspect.type]
        }))
        .sort((a, b) => a.orb - b.orb);

    return {
        headlines,
        placements,
        aspects,
        legend: [
            { term: "Planet", meaning: "The part of life or inner function being described." },
            { term: "Sign", meaning: "The style and qualities through which it may be expressed." },
            { term: "House", meaning: "The area of life where the placement tends to show up." },
            { term: "Gold line", meaning: "A flowing trine or sextile aspect." },
            { term: "Rose line", meaning: "A dynamic square or opposition aspect." },
            { term: "Ivory line", meaning: "A conjunction joining two planetary themes." }
        ],
        disclaimer: "This guide presents astrology as a symbolic and reflective tradition, not a scientific claim or fixed account of personality."
    };
}
