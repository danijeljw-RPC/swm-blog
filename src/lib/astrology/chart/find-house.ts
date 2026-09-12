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
