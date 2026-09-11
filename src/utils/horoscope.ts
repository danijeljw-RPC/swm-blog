import type { ZodiacSlug } from "../config/zodiac";

export type HoroscopePeriod = "daily" | "weekly";

export interface HoroscopeResult {
  date: string;
  period: HoroscopePeriod;
  sign: string;
  horoscope: string;
}

const baseUrl = "https://freehoroscopeapi.com/api/v1/get-horoscope";

export async function getHoroscope(sign: ZodiacSlug, period: HoroscopePeriod): Promise<HoroscopeResult> {
  const response = await fetch(`${baseUrl}/${period}?sign=${sign}`, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(8_000) });
  if (!response.ok) throw new Error(`Horoscope provider returned ${response.status}`);
  const payload = await response.json() as { data?: Partial<HoroscopeResult> };
  const data = payload.data;
  if (!data || typeof data.date !== "string" || (data.period !== "daily" && data.period !== "weekly") || typeof data.sign !== "string" || typeof data.horoscope !== "string") {
    throw new Error("Horoscope provider returned an invalid response");
  }
  return { date: data.date, period: data.period, sign: data.sign, horoscope: data.horoscope };
}
