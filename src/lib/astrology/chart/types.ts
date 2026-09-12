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
