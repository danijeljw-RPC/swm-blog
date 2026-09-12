export const DEFAULT_MOON_TIME_ZONE = "UTC";

interface CloudflareRequest extends Request {
  cf?: { timezone?: unknown };
}

export function getRequestTimeZone(request: Request): string {
  const candidate = (request as CloudflareRequest).cf?.timezone;
  if (typeof candidate !== "string") return DEFAULT_MOON_TIME_ZONE;

  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: candidate }).format(0);
    return candidate;
  } catch {
    return DEFAULT_MOON_TIME_ZONE;
  }
}

export function getVisitorLocalDate(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const valueFor = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value;
  const year = valueFor("year");
  const month = valueFor("month");
  const day = valueFor("day");

  if (!year || !month || !day) throw new Error(`Unable to derive a calendar date for timezone ${timeZone}.`);
  return `${year}-${month}-${day}`;
}

export function localDateToCalculationDate(localDate: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) throw new Error("Moon phase local date must use YYYY-MM-DD format.");

  const [, year, month, day] = match;
  const result = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), 12));
  const isSameCalendarDate = result.getUTCFullYear() === Number(year)
    && result.getUTCMonth() === Number(month) - 1
    && result.getUTCDate() === Number(day);

  if (!isSameCalendarDate) throw new Error("Moon phase local date must be a valid calendar date.");
  return result;
}
