export function decimalUtcHour(date: Date): number {
    return (
        date.getUTCHours()
        + date.getUTCMinutes() / 60
        + date.getUTCSeconds() / 3600
        + date.getUTCMilliseconds() / 3_600_000
    );
}
