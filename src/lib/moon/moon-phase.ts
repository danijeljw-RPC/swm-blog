export const MOON_PHASES = [
  "new-moon",
  "waxing-crescent",
  "first-quarter",
  "waxing-gibbous",
  "full-moon",
  "waning-gibbous",
  "last-quarter",
  "waning-crescent",
] as const;

export type MoonPhase = (typeof MOON_PHASES)[number];

export const MOON_PHASE_LABELS: Record<MoonPhase, string> = {
  "new-moon": "New Moon",
  "waxing-crescent": "Waxing Crescent",
  "first-quarter": "First Quarter",
  "waxing-gibbous": "Waxing Gibbous",
  "full-moon": "Full Moon",
  "waning-gibbous": "Waning Gibbous",
  "last-quarter": "Last Quarter",
  "waning-crescent": "Waning Crescent",
};

export const MOON_PHASE_IMAGES: Record<MoonPhase, string> = Object.fromEntries(
  MOON_PHASES.map((phase) => [phase, `/images/moon/${phase}.svg`]),
) as Record<MoonPhase, string>;

const SYNODIC_MONTH_DAYS = 29.530588853;
const MILLISECONDS_PER_DAY = 86_400_000;
const NEW_MOON_REFERENCE = Date.UTC(2000, 0, 6, 18, 14);

export function getMoonPhase(date: Date): MoonPhase {
  const daysSinceReference = (date.getTime() - NEW_MOON_REFERENCE) / MILLISECONDS_PER_DAY;
  const age = ((daysSinceReference % SYNODIC_MONTH_DAYS) + SYNODIC_MONTH_DAYS) % SYNODIC_MONTH_DAYS;
  const fraction = age / SYNODIC_MONTH_DAYS;

  if (fraction < 0.0625 || fraction >= 0.9375) return "new-moon";
  if (fraction < 0.1875) return "waxing-crescent";
  if (fraction < 0.3125) return "first-quarter";
  if (fraction < 0.4375) return "waxing-gibbous";
  if (fraction < 0.5625) return "full-moon";
  if (fraction < 0.6875) return "waning-gibbous";
  if (fraction < 0.8125) return "last-quarter";
  return "waning-crescent";
}
