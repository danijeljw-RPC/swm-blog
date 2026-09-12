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
