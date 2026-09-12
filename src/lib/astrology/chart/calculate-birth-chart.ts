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
