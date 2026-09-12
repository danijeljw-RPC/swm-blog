import moonPhaseData from "../../data/moon-phases.json";
import {
  MOON_PHASE_IMAGES,
  MOON_PHASE_LABELS,
  MOON_PHASES,
  getMoonPhase,
  type MoonPhase,
} from "./moon-phase";
import {
  getRequestTimeZone,
  getVisitorLocalDate,
  localDateToCalculationDate,
} from "./moon-date";

export interface MoonPhaseContent {
  name: string;
  summary: string;
  meaning: string;
  energy: string;
  focus: string[];
  reflection: string[];
  practices: string[];
}

export interface MoonPhaseViewModel extends MoonPhaseContent {
  date: string;
  phase: MoonPhase;
  image: string;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.length > 0 && value.every(isNonEmptyString);
}

function isMoonPhaseContent(value: unknown, expectedName: string): value is MoonPhaseContent {
  if (!value || typeof value !== "object") return false;
  const content = value as Record<string, unknown>;
  return content.name === expectedName
    && isNonEmptyString(content.summary)
    && isNonEmptyString(content.meaning)
    && isNonEmptyString(content.energy)
    && isNonEmptyStringArray(content.focus)
    && isNonEmptyStringArray(content.reflection)
    && isNonEmptyStringArray(content.practices);
}

const rawContent = moonPhaseData as Record<string, unknown>;
const contentKeys = Object.keys(rawContent).sort();
const phaseKeys = [...MOON_PHASES].sort();

if (contentKeys.length !== phaseKeys.length || contentKeys.some((key, index) => key !== phaseKeys[index])) {
  throw new Error("Moon phase content must contain exactly the eight canonical phase keys.");
}

for (const phase of MOON_PHASES) {
  if (!isMoonPhaseContent(rawContent[phase], MOON_PHASE_LABELS[phase])) {
    throw new Error(`Moon phase content for ${phase} is missing or invalid.`);
  }
}

const moonPhaseContent = rawContent as Record<MoonPhase, MoonPhaseContent>;

export function getMoonPhaseContent(phase: MoonPhase): MoonPhaseContent {
  return moonPhaseContent[phase];
}

export function getMoonPhaseViewModel(request: Request, now = new Date()): MoonPhaseViewModel {
  const timeZone = getRequestTimeZone(request);
  const date = getVisitorLocalDate(now, timeZone);
  const phase = getMoonPhase(localDateToCalculationDate(date));

  return {
    date,
    phase,
    image: MOON_PHASE_IMAGES[phase],
    ...getMoonPhaseContent(phase),
  };
}
