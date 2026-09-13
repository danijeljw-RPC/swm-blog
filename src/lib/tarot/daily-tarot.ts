export type TarotOrientation = "upright" | "reversed";

export interface DailyTarotDraw {
  cardIndex: number;
  orientation: TarotOrientation;
}

const encoder = new TextEncoder();

async function sha256(value: string): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
}

function bytesToHex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function calendarDayNumber(localDate: string): number {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(localDate);
  if (!match) throw new Error("Daily tarot date must use YYYY-MM-DD format.");

  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (date.toISOString().slice(0, 10) !== localDate) throw new Error("Daily tarot date must be valid.");
  return Math.floor(date.getTime() / 86_400_000);
}

async function shuffledCardIndices(cycle: number, timeZone: string, deckSize: number): Promise<number[]> {
  const seed = `sisters-with-mirrors:daily-tarot:${timeZone}:cycle:${cycle}`;
  const scored = await Promise.all(
    Array.from({ length: deckSize }, async (_, cardIndex) => ({
      cardIndex,
      score: bytesToHex(await sha256(`${seed}:card:${cardIndex}`)),
    })),
  );

  return scored
    .sort((left, right) => left.score < right.score ? -1 : left.score > right.score ? 1 : 0)
    .map(({ cardIndex }) => cardIndex);
}

export async function getDailyTarotDraw(
  localDate: string,
  timeZone: string,
  deckSize: number,
): Promise<DailyTarotDraw> {
  if (!Number.isInteger(deckSize) || deckSize < 2) throw new Error("Daily tarot requires at least two cards.");

  const dayNumber = calendarDayNumber(localDate);
  const cycle = Math.floor(dayNumber / deckSize);
  const position = ((dayNumber % deckSize) + deckSize) % deckSize;
  const [deck, previousDeck, orientationDigest] = await Promise.all([
    shuffledCardIndices(cycle, timeZone, deckSize),
    shuffledCardIndices(cycle - 1, timeZone, deckSize),
    sha256(`sisters-with-mirrors:daily-tarot:${localDate}:${timeZone}:orientation`),
  ]);

  if (deck[0] === previousDeck.at(-1)) {
    [deck[0], deck[1]] = [deck[1], deck[0]];
  }

  return {
    cardIndex: deck[position],
    orientation: orientationDigest[0] % 2 === 0 ? "upright" : "reversed",
  };
}
