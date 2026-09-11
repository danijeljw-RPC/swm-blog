import referenceData from "../data/astrological/astrological-metaphysical-reference.json";
import chakraData from "../data/chakras/chakra-metaphysical-reference.json";

export type ElementReference = (typeof referenceData.elements)[keyof typeof referenceData.elements] | (typeof extendedElements)[keyof typeof extendedElements];
export type ZodiacReference = (typeof referenceData.zodiac_signs)[keyof typeof referenceData.zodiac_signs];
export type PlanetReference = (typeof referenceData.planets)[keyof typeof referenceData.planets];

type ReferenceEntry<T> = { slug: string; data: T };

function entries<T>(record: Record<string, T>): ReferenceEntry<T>[] {
  return Object.entries(record).map(([slug, data]) => ({ slug, data }));
}

const extendedElements = {
  ether: { name: "Ether", symbol: "✦", polarity: "subtle", qualities: ["spacious", "transcendent", "permeable"], core_domain: "Space, resonance, connection and subtle presence", keywords: ["space", "resonance", "voice", "presence"], description: "Ether is the subtle field that gives the other elements room to move: space, resonance, listening and connection.", metaphysical_meaning: "In metaphysical traditions, Ether points to the space between forms and the quiet awareness that holds experience.", balanced_expression: ["presence", "deep listening", "openness", "connection"], shadow_expression: ["dissociation", "avoidance", "spiritual bypassing", "disconnection"], needs_for_balance: ["embodiment", "boundaries", "clear language"], associated_faculty: "resonance", associated_direction: "above", associated_season: "all seasons", associated_time_of_day: "the pause", associated_tarot_suit: "Major Arcana", zodiac_signs: [], journal_prompts: ["What becomes possible when I make more space?", "Where am I ready to listen more deeply?"] },
  mind: { name: "Mind / Light", symbol: "◈", polarity: "subtle", qualities: ["lucid", "perceptive", "integrative"], core_domain: "Insight, vision, pattern and inner knowing", keywords: ["insight", "vision", "clarity", "intuition"], description: "Mind / Light names the field of perception where intuition, imagination and pattern recognition meet.", metaphysical_meaning: "As a symbolic correspondence, Mind / Light illuminates inner experience and invites discernment without mistaking metaphor for certainty.", balanced_expression: ["discernment", "imagination", "perspective", "intuition"], shadow_expression: ["confusion", "projection", "over-analysis", "certainty without evidence"], needs_for_balance: ["grounding", "curiosity", "humility"], associated_faculty: "vision", associated_direction: "within", associated_season: "thresholds", associated_time_of_day: "twilight", associated_tarot_suit: "The Star", zodiac_signs: [], journal_prompts: ["What pattern am I beginning to see?", "How can I hold insight with humility?"] },
  spirit: { name: "Spirit / Consciousness", symbol: "✧", polarity: "unifying", qualities: ["integrative", "devotional", "expansive"], core_domain: "Meaning, unity, wonder and belonging to the whole", keywords: ["spirit", "meaning", "unity", "wonder"], description: "Spirit / Consciousness is a symbolic name for the sense of meaning and connection that exceeds the individual self.", metaphysical_meaning: "This correspondence gestures toward awe, devotion and the felt relationship between a person and the wider web of life.", balanced_expression: ["wonder", "compassion", "meaning", "belonging"], shadow_expression: ["grandiosity", "escape", "dogma", "disembodiment"], needs_for_balance: ["humility", "service", "ordinary life"], associated_faculty: "consciousness", associated_direction: "all directions", associated_season: "beyond season", associated_time_of_day: "starlight", associated_tarot_suit: "The World", zodiac_signs: [], journal_prompts: ["What gives my life a sense of meaning?", "How can wonder become a grounded practice?"] },
};

export const ELEMENTS = [...entries(referenceData.elements), ...entries(extendedElements)];
export const ZODIAC_REFERENCES = entries(referenceData.zodiac_signs);
export const PLANETS = entries(referenceData.planets);

export const GLOSSARY = referenceData.glossary;

export type ChakraReference = (typeof chakraData.chakras)[keyof typeof chakraData.chakras];
export const CHAKRAS = entries(chakraData.chakras);

export function formatReferenceLabel(value: string) {
  return value.replaceAll("_", " ");
}

export function getElement(slug: string | undefined): ElementReference | undefined {
  return slug ? (ELEMENTS.find((entry) => entry.slug === slug)?.data as ElementReference | undefined) : undefined;
}

export function getZodiacReference(slug: string | undefined): ZodiacReference | undefined {
  return slug ? (referenceData.zodiac_signs as Record<string, ZodiacReference>)[slug] : undefined;
}

export function getPlanet(slug: string | undefined): PlanetReference | undefined {
  return slug ? (referenceData.planets as Record<string, PlanetReference>)[slug] : undefined;
}

export function getChakra(slug: string | undefined): ChakraReference | undefined {
  return slug ? (chakraData.chakras as Record<string, ChakraReference>)[Object.keys(chakraData.chakras).find((key) => chakraData.chakras[key as keyof typeof chakraData.chakras].slug === slug) ?? ""] : undefined;
}

const planetNameToSlug: Record<string, string> = Object.fromEntries(PLANETS.map(({ slug, data }) => [data.name.toLowerCase(), slug]));
const zodiacNameToSlug: Record<string, string> = Object.fromEntries(ZODIAC_REFERENCES.map(({ slug, data }) => [data.name.toLowerCase(), slug]));

export function getChakraPlanetLinks(chakraSlug: string) {
  const chakra = getChakra(chakraSlug);
  return (chakra?.associated_planets ?? []).flatMap((value: string) => {
    const slug = planetNameToSlug[value.toLowerCase().split(" ")[0]];
    return slug ? [{ slug, name: getPlanet(slug)?.name ?? value }] : [];
  });
}

export function getChakraZodiacLinks(chakraSlug: string) {
  const chakra = getChakra(chakraSlug);
  return (chakra?.associated_zodiac_signs ?? []).flatMap((value: string) => {
    const slug = zodiacNameToSlug[value.toLowerCase()];
    return slug ? [{ slug, name: getZodiacReference(slug)?.name ?? value }] : [];
  });
}

export function chakraReferenceHref(name: string) {
  const match = CHAKRAS.find(({ data }) => data.name.toLowerCase() === name.trim().toLowerCase() || data.common_name.toLowerCase() === name.trim().toLowerCase());
  return match ? `/chakras/${match.data.slug}/` : "/chakras/";
}

export function getPlanetarySignLinks(planetSlug: string): Array<{
  slug: string;
  relationship: "rules" | "traditional ruler";
}> {
  const planet = getPlanet(planetSlug) as (PlanetReference & { traditional_rules?: string[] }) | undefined;
  if (!planet) return [];

  return [
    ...planet.rules.map((slug) => ({ slug, relationship: "rules" as const })),
    ...(planet.traditional_rules ?? []).map((slug) => ({
      slug,
      relationship: "traditional ruler" as const,
    })),
  ];
}

export function referenceImagePath(kind: "elements" | "planets" | "zodiac", slug: string) {
  if (kind === "elements" && ["ether", "mind", "spirit"].includes(slug)) return `/images/elements/${slug}.svg`;
  const imageSlug = kind === "elements" && slug === "air" ? "wind" : slug;
  return `/images/${kind}/${imageSlug}.png`;
}
