import assert from "node:assert/strict";
import test from "node:test";
import { buildBirthChartReading } from "../src/lib/astrology/chart/interpretation.ts";
import { birthChartPdfFilename, createBirthChartPdf, pdfAspectStyle } from "../src/lib/astrology/chart/pdf.ts";
import type { BirthChart, PlanetName } from "../src/lib/astrology/chart/types.ts";

const names: PlanetName[] = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto", "Chiron"];
const signs = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius"] as const;
const chart: BirthChart = {
  julianDay: 2447892.5,
  planets: names.map((name, index) => ({ name, longitude: index * 31, latitude: 0, distance: 1, sign: signs[index], degree: index + 1, minute: 5, second: 0, house: index + 1 })),
  houses: Array.from({ length: 12 }, (_, index) => ({ house: index + 1, longitude: index * 30, sign: "Aries", degree: 0, minute: 0, second: 0 })),
  ascendant: { longitude: 4, sign: "Aries", degree: 4, minute: 0, second: 0 },
  midheaven: { longitude: 274, sign: "Capricorn", degree: 4, minute: 0, second: 0 },
  aspects: names.slice(1, 8).map((name, index) => ({ from: "Sun", to: name, type: index % 2 ? "Trine" : "Square", exactAngle: index % 2 ? 120 : 90, actualAngle: 90 + index, orb: index + 0.4 })),
  birthplace: { id: 1, name: "São Paulo / Central", region: "São Paulo", country: "Brazil", latitude: -23.5, longitude: -46.6, timezone: "America/Sao_Paulo" },
  birthTimeUtc: "1990-01-01T03:30:00.000Z"
};

test("creates a safe descriptive PDF filename", () => {
  assert.equal(birthChartPdfFilename("São Paulo / Central", "1990-01-01"), "birth-chart-sao-paulo-central-1990-01-01.pdf");
});

test("creates a valid multi-page birth chart guide without unwanted framing or return link", () => {
  const bytes = createBirthChartPdf({ chart, reading: buildBirthChartReading(chart), localDate: "1990-01-01", localTime: "00:30" });
  const text = new TextDecoder("latin1").decode(bytes);
  assert.equal(text.slice(0, 5), "%PDF-");
  assert.ok(bytes.byteLength > 10_000);
  assert.ok((text.match(/\/Type \/Page\b/g) ?? []).length > 1);
  assert.doesNotMatch(text, /symbolic and reflective tradition/i);
  assert.doesNotMatch(text, /Return to the Birth Chart/i);
});

test("uses a thick, distinct colour for every supported aspect", () => {
  const types = ["Conjunction", "Sextile", "Square", "Trine", "Opposition"] as const;
  const styles = types.map(pdfAspectStyle);
  assert.equal(new Set(styles.map(style => style.color.join(","))).size, types.length);
  assert.ok(styles.every(style => style.lineWidth >= 0.8));
});
