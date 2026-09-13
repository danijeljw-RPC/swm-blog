import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

import moonPhases from "../src/data/moon-phases.json" with { type: "json" };
import { getMoonPhaseContent, getMoonPhaseViewModel } from "../src/lib/moon/moon-phase-content.ts";
import { MOON_PHASE_IMAGES, MOON_PHASE_LABELS, MOON_PHASES } from "../src/lib/moon/moon-phase.ts";

function requestWithCf(timezone: string): Request {
  const request = new Request("https://example.test");
  Object.defineProperty(request, "cf", { value: { timezone } });
  return request;
}

test("every canonical phase has complete typed content and an image mapping", async () => {
  assert.deepEqual(Object.keys(moonPhases).sort(), [...MOON_PHASES].sort());

  for (const phase of MOON_PHASES) {
    const content = getMoonPhaseContent(phase);
    assert.equal(content.name, MOON_PHASE_LABELS[phase]);
    assert.ok(content.summary.length > 0, `${phase} summary`);
    assert.ok(content.meaning.length > 0, `${phase} meaning`);
    assert.ok(content.energy.length > 0, `${phase} energy`);
    assert.ok(content.focus.length > 0, `${phase} focus`);
    assert.ok(content.reflection.length > 0, `${phase} reflection`);
    assert.ok(content.practices.length > 0, `${phase} practices`);
    assert.equal(MOON_PHASE_IMAGES[phase], `/images/moon/${phase}.svg`);
    await access(new URL(`../public${MOON_PHASE_IMAGES[phase]}`, import.meta.url));
  }
});

test("every canonical Moon image is valid renderable SVG artwork", async () => {
  for (const phase of MOON_PHASES) {
    const imagePath = fileURLToPath(new URL(`../public${MOON_PHASE_IMAGES[phase]}`, import.meta.url));
    const metadata = await sharp(imagePath).metadata();

    assert.equal(metadata.format, "svg", `${phase} image format`);
    assert.equal(metadata.width, 240, `${phase} image width`);
    assert.equal(metadata.height, 240, `${phase} image height`);
  }
});

test("moon view model derives date, phase, content, and image from one request", () => {
  const moon = getMoonPhaseViewModel(
    requestWithCf("Pacific/Kiritimati"),
    new Date("2026-09-13T10:30:00.000Z"),
  );

  assert.equal(moon.date, "2026-09-14");
  assert.equal(moon.phase, "waxing-crescent");
  assert.equal(moon.name, "Waxing Crescent");
  assert.equal(moon.image, "/images/moon/waxing-crescent.svg");
});

test("moon view model remains available without Cloudflare metadata", () => {
  const moon = getMoonPhaseViewModel(
    new Request("https://example.test"),
    new Date("2000-01-06T01:00:00.000Z"),
  );

  assert.equal(moon.date, "2000-01-06");
  assert.equal(moon.phase, "new-moon");
});
