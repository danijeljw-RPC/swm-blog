export type AstrologyReferenceKind = "planet" | "zodiac" | "element";

const routeSegments: Record<AstrologyReferenceKind, string> = {
  planet: "planets",
  zodiac: "zodiac",
  element: "elements",
};

export function astrologyReferenceHref(kind: AstrologyReferenceKind, name: string) {
  return `/astrology/${routeSegments[kind]}/${name.trim().toLowerCase()}/`;
}
