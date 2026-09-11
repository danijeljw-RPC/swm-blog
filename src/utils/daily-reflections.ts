export interface ColourOfTheDay {
  date: string;
  hex: string;
  name: string;
}

type FetchImplementation = typeof fetch;

const DEFAULT_TIME_ZONE = "Australia/Adelaide";

export function getDateInTimeZone(date = new Date(), timeZone = DEFAULT_TIME_ZONE): string {
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

  if (!year || !month || !day) throw new Error("Unable to derive a calendar date for the configured timezone.");
  return `${year}-${month}-${day}`;
}

export async function getNumberOfTheDay(date = new Date(), timeZone = DEFAULT_TIME_ZONE): Promise<number> {
  const dateString = getDateInTimeZone(date, timeZone);
  const digest = await sha256(`sisters-with-mirrors:number-of-the-day:${dateString}`);
  const value = digest.slice(0, 8).reduce((total, byte) => (total << 8n) | BigInt(byte), 0n);

  return Number(value % 100n) + 1;
}

export async function getColourOfTheDay(
  date = new Date(),
  timeZone = DEFAULT_TIME_ZONE,
  fetchImplementation: FetchImplementation = fetch,
): Promise<ColourOfTheDay> {
  const dateString = getDateInTimeZone(date, timeZone);
  const bytes = await sha256(`sisters-with-mirrors:colour-of-the-day:${dateString}`);
  const hue = ((bytes[0] << 8) | bytes[1]) % 360;
  const saturation = 55 + (bytes[2] % 31);
  const lightness = 40 + (bytes[3] % 31);
  const hex = hslToHex(hue, saturation, lightness);

  try {
    const response = await fetchImplementation(`https://www.thecolorapi.com/id?hex=${hex.slice(1)}`);
    if (!response.ok) throw new Error(`The Color API returned HTTP ${response.status}`);
    const colour = await response.json() as { name?: { value?: string }; hex?: { value?: string } };
    if (!colour.name?.value || !colour.hex?.value) throw new Error("The Color API returned an incomplete colour response.");

    return { date: dateString, hex: colour.hex.value, name: colour.name.value };
  } catch {
    return { date: dateString, hex, name: "Colour name unavailable" };
  }
}

async function sha256(value: string): Promise<Uint8Array> {
  const data = new TextEncoder().encode(value);
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const s = saturation / 100;
  const l = lightness / 100;
  const chroma = (1 - Math.abs(2 * l - 1)) * s;
  const x = chroma * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - chroma / 2;
  const [r, g, b] = hue < 60 ? [chroma, x, 0]
    : hue < 120 ? [x, chroma, 0]
      : hue < 180 ? [0, chroma, x]
        : hue < 240 ? [0, x, chroma]
          : hue < 300 ? [x, 0, chroma]
            : [chroma, 0, x];
  const toHex = (value: number) => Math.round((value + m) * 255).toString(16).padStart(2, "0");

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
