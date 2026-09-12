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
