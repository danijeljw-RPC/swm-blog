import assert from "node:assert/strict";
import test from "node:test";
import { buildBirthChartReading } from "../src/lib/astrology/chart/interpretation.ts";
import type { BirthChart } from "../src/lib/astrology/chart/types.ts";

const point = (sign: string, degree: number, longitude: number) => ({
  sign: sign as BirthChart["ascendant"]["sign"], degree, minute: 5, second: 0, longitude
});

const chart: BirthChart = {
  julianDay: 2447892.5,
  planets: [
    { name: "Sun", ...point("Aries", 10, 10), latitude: 0, distance: 1, house: 1 },
    { name: "Moon", ...point("Cancer", 10, 100), latitude: 0, distance: 1, house: 4 },
    { name: "Mercury", ...point("Aries", 12, 12.1), latitude: 0, distance: 1, house: 1 }
  ],
  houses: Array.from({ length: 12 }, (_, index) => ({
    house: index + 1,
    ...point("Aries", 0, index * 30)
  })),
  ascendant: point("Aries", 4, 4),
  midheaven: point("Capricorn", 4, 274),
  aspects: [
    { from: "Sun", to: "Mercury", type: "Conjunction", exactAngle: 0, actualAngle: 2.1, orb: 2.1 },
    { from: "Sun", to: "Moon", type: "Square", exactAngle: 90, actualAngle: 90.4, orb: 0.4 }
  ],
  birthplace: { id: 1, name: "Adelaide", region: "South Australia", country: "Australia", latitude: -34.9, longitude: 138.6, timezone: "Australia/Adelaide" },
  birthTimeUtc: "1990-01-01T01:00:00.000Z"
};

test("builds an approachable overview and placement reading", () => {
  const reading = buildBirthChartReading(chart);
  assert.deepEqual(reading.headlines.map(({ label }) => label), ["Sun", "Moon", "Ascendant", "Midheaven"]);
  assert.equal(reading.headlines[0].position, "10°05' Aries");
  assert.match(reading.placements[0].interpretation, /identity/i);
  assert.match(reading.placements[0].interpretation, /Aries/i);
  assert.match(reading.placements[0].interpretation, /House 1/i);
  assert.match(reading.disclaimer, /symbolic and reflective tradition/i);
});

test("orders major aspects from tightest to widest orb", () => {
  const reading = buildBirthChartReading(chart);
  assert.deepEqual(reading.aspects.map(({ orb }) => orb), [0.4, 2.1]);
});

test("falls back to placement facts when sign reference content is unavailable", () => {
  const unknown = structuredClone(chart);
  unknown.planets[0].sign = "Unknown" as BirthChart["ascendant"]["sign"];
  const placement = buildBirthChartReading(unknown).placements[0];
  assert.equal(placement.interpretation, "Sun is at 10°05' Unknown in House 1.");
});
