import assert from "node:assert/strict";
import test from "node:test";

import {
  getRequestTimeZone,
  getVisitorLocalDate,
  localDateToCalculationDate,
} from "../src/lib/moon/moon-date.ts";
import { getMoonPhase } from "../src/lib/moon/moon-phase.ts";

function requestWithCf(timezone: unknown): Request {
  const request = new Request("https://example.test");
  Object.defineProperty(request, "cf", { value: { timezone } });
  return request;
}

test("visitor date follows the Cloudflare timezone calendar day", () => {
  const instant = new Date("2026-09-13T10:30:00.000Z");

  assert.equal(getVisitorLocalDate(instant, "Pacific/Kiritimati"), "2026-09-14");
  assert.equal(getVisitorLocalDate(instant, "Pacific/Honolulu"), "2026-09-13");
});

test("request timezone uses valid Cloudflare metadata and otherwise falls back to UTC", () => {
  assert.equal(getRequestTimeZone(requestWithCf("Australia/Adelaide")), "Australia/Adelaide");
  assert.equal(getRequestTimeZone(new Request("https://example.test")), "UTC");
  assert.equal(getRequestTimeZone(requestWithCf("Not/A_Timezone")), "UTC");
  assert.equal(getRequestTimeZone(requestWithCf(42)), "UTC");
});

test("local calendar dates become stable UTC-noon calculation instants", () => {
  assert.equal(localDateToCalculationDate("2026-09-14").toISOString(), "2026-09-14T12:00:00.000Z");
  assert.throws(() => localDateToCalculationDate("14-09-2026"), /YYYY-MM-DD/);
  assert.throws(() => localDateToCalculationDate("2026-02-30"), /valid calendar date/);
});

test("moon calculation identifies all eight phase sectors and wraps at new moon", () => {
  const cases = [
    ["2000-01-06T18:14:00.000Z", "new-moon"],
    ["2000-01-10T10:49:30.359Z", "waxing-crescent"],
    ["2000-01-14T03:25:00.719Z", "first-quarter"],
    ["2000-01-17T20:00:31.078Z", "waxing-gibbous"],
    ["2000-01-21T12:36:01.438Z", "full-moon"],
    ["2000-01-25T05:11:31.798Z", "waning-gibbous"],
    ["2000-01-28T21:47:02.157Z", "last-quarter"],
    ["2000-02-01T14:22:32.517Z", "waning-crescent"],
    ["2000-02-03T19:31:50.733Z", "new-moon"],
  ] as const;

  for (const [instant, expected] of cases) {
    assert.equal(getMoonPhase(new Date(instant)), expected, instant);
  }
});

test("moon calculation changes phase at sector boundaries", () => {
  const boundaries = [
    ["2000-01-12T07:07:15.539Z", "waxing-crescent", "2000-01-12T07:07:15.540Z", "first-quarter"],
    ["2000-01-19T16:18:16.258Z", "waxing-gibbous", "2000-01-19T16:18:16.259Z", "full-moon"],
    ["2000-01-27T01:29:16.977Z", "waning-gibbous", "2000-01-27T01:29:16.978Z", "last-quarter"],
    ["2000-02-03T10:40:17.697Z", "waning-crescent", "2000-02-03T10:40:17.698Z", "new-moon"],
  ] as const;

  for (const [before, expectedBefore, at, expectedAt] of boundaries) {
    assert.equal(getMoonPhase(new Date(before)), expectedBefore, `${before} before boundary`);
    assert.equal(getMoonPhase(new Date(at)), expectedAt, `${at} at boundary`);
  }
});

test("moon calculation uses positive modulo before the reference new moon", () => {
  assert.equal(getMoonPhase(new Date("2000-01-03T19:21:35.712Z")), "waning-crescent");
});
