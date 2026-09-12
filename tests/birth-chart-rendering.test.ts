import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { renderChartReading } from "../src/components/astrology/render-chart-reading.ts";
import type { BirthChartReading } from "../src/lib/astrology/chart/interpretation.ts";
import type { BirthChart } from "../src/lib/astrology/chart/types.ts";

const chart = {
  planets: [{ name: "Sun", sign: "Aries", degree: 10, minute: 5, house: 1 }],
  aspects: [],
  birthplace: { name: "<script>alert(1)</script>", region: null, country: "Australia" },
  birthTimeUtc: "1990-01-01T01:00:00.000Z"
} as unknown as BirthChart;

const reading: BirthChartReading = {
  headlines: [{ label: "Sun", position: "10°05' Aries", meaning: "Core identity." }],
  placements: [{ name: "Sun", symbol: "☉", position: "10°05' Aries", houseLabel: "House 1", role: "Identity", interpretation: "A reflective reading." }],
  aspects: [],
  legend: [{ term: "Planet", meaning: "What is expressed." }],
  disclaimer: "This is a symbolic and reflective tradition."
};

test("renders an approachable, semantic, escaped chart reading", () => {
  const html = renderChartReading(reading, chart, { localDate: "1990-01-01", localTime: "11:30" });
  assert.match(html, /Your chart at a glance/);
  assert.match(html, /Chart legend/);
  assert.match(html, /Planet placements/);
  assert.match(html, /Major aspects/);
  assert.match(html, /No major aspects were found/);
  assert.match(html, /<details class="technical-details">/);
  assert.match(html, /Placidus houses/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
});

test("birth chart page exposes the result region and PDF control", async () => {
  const page = await readFile("src/pages/astrology/birth-chart/index.astro", "utf8");
  assert.match(page, /id="chart-result"/);
  assert.match(page, /id="chart-download"/);
  assert.match(page, /Download your chart guide/);
  assert.match(page, /symbolic and reflective tradition/);
});

test("birth chart controller prepares and reports PDF downloads", async () => {
  const controller = await readFile("src/components/astrology/NatalChart.ts", "utf8");
  assert.match(controller, /downloadBirthChartPdf/);
  assert.match(controller, /Preparing guide…/);
  assert.match(controller, /Your chart is still available, but the PDF could not be created/);
});
