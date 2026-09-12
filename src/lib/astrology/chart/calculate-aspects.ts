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
