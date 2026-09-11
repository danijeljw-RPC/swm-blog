import assert from "node:assert/strict";
import test from "node:test";

import { getCurrentZodiacSign } from "../src/config/zodiac.ts";
import {
  getColourOfTheDay,
  getDateInTimeZone,
  getNumberOfTheDay,
} from "../src/utils/daily-reflections.ts";

test("current zodiac sign observes tropical date boundaries", () => {
  assert.equal(getCurrentZodiacSign("2026-08-22")?.slug, "leo");
  assert.equal(getCurrentZodiacSign("2026-08-23")?.slug, "virgo");
  assert.equal(getCurrentZodiacSign("2026-09-22")?.slug, "virgo");
  assert.equal(getCurrentZodiacSign("2026-09-23")?.slug, "libra");
  assert.equal(getCurrentZodiacSign("2026-12-22")?.slug, "capricorn");
  assert.equal(getCurrentZodiacSign("2027-01-19")?.slug, "capricorn");
  assert.equal(getCurrentZodiacSign("2027-01-20")?.slug, "aquarius");
});

test("date derivation uses the configured timezone calendar day", () => {
  const instant = new Date("2026-09-10T14:45:00.000Z");

  assert.equal(getDateInTimeZone(instant, "Australia/Adelaide"), "2026-09-11");
  assert.equal(getDateInTimeZone(instant, "America/Los_Angeles"), "2026-09-10");
});

test("number of the day is the specified SHA-256 result for a known date", async () => {
  assert.equal(await getNumberOfTheDay(new Date("2026-09-11T12:00:00.000Z"), "Australia/Adelaide"), 78);
});

test("number of the day is repeatable, bounded, and changes independently across dates", async () => {
  const first = await getNumberOfTheDay(new Date("2026-09-11T12:00:00.000Z"));
  const second = await getNumberOfTheDay(new Date("2026-09-11T13:00:00.000Z"));
  const nextDay = await getNumberOfTheDay(new Date("2026-09-12T12:00:00.000Z"));

  assert.equal(first, second);
  assert.equal(first, 78);
  assert.equal(nextDay, 100);
  assert.ok(first >= 1 && first <= 100);
  assert.ok(nextDay >= 1 && nextDay <= 100);
});

test("colour of the day derives its hex then returns the public API name", async () => {
  let requestedUrl = "";
  const result = await getColourOfTheDay(
    new Date("2026-09-11T12:00:00.000Z"),
    "Australia/Adelaide",
    async (input) => {
      requestedUrl = String(input);
      return new Response(JSON.stringify({ name: { value: "Midnight Bloom" }, hex: { value: "#123ABC" } }));
    },
  );

  assert.equal(result.date, "2026-09-11");
  assert.equal(result.name, "Midnight Bloom");
  assert.equal(result.hex, "#123ABC");
  assert.match(requestedUrl, /^https:\/\/www\.thecolorapi\.com\/id\?hex=[0-9A-F]{6}$/);
});

test("colour of the day remains displayable when the public API is unavailable", async () => {
  const result = await getColourOfTheDay(
    new Date("2026-09-11T12:00:00.000Z"),
    "Australia/Adelaide",
    async () => new Response("unavailable", { status: 503 }),
  );

  assert.equal(result.date, "2026-09-11");
  assert.equal(result.name, "Colour name unavailable");
  assert.match(result.hex, /^#[0-9A-F]{6}$/);
});
