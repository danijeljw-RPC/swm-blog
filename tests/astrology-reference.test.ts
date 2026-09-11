import assert from "node:assert/strict";
import test from "node:test";

import {
  ELEMENTS,
  PLANETS,
  ZODIAC_REFERENCES,
  getElement,
  getPlanet,
  getZodiacReference,
  getPlanetarySignLinks,
  formatReferenceLabel,
  CHAKRAS,
  getChakra,
  getChakraPlanetLinks,
  getChakraZodiacLinks,
  chakraReferenceHref,
} from "../src/utils/astrology-reference.ts";

test("reference collections expose every supported detail route", () => {
  assert.deepEqual(ELEMENTS.map(({ slug }) => slug), ["air", "fire", "water", "earth", "ether", "mind", "spirit"]);
  assert.equal(ZODIAC_REFERENCES.length, 12);
  assert.equal(PLANETS.length, 11);
  assert.equal(getElement("fire")?.name, "Fire");
  assert.equal(getZodiacReference("aries")?.ruling_planet, "mars");
  assert.equal(getPlanet("mars")?.name, "Mars");
  assert.equal(getPlanet("ceres"), undefined);
});

test("reference labels turn data keys into reader-facing words", () => {
  assert.equal(formatReferenceLabel("dwarf_planet"), "dwarf planet");
  assert.equal(formatReferenceLabel("centaur_minor_body"), "centaur minor body");
});

test("planetary sign links combine modern and traditional rulerships without annotations", () => {
  assert.deepEqual(getPlanetarySignLinks("mars"), [
    { slug: "aries", relationship: "rules" },
    { slug: "scorpio", relationship: "traditional ruler" },
  ]);
  assert.deepEqual(getPlanetarySignLinks("chiron"), []);
});

test("every zodiac sign resolves to a valid element and ruling planet", () => {
  for (const { data } of ZODIAC_REFERENCES) {
    assert.ok(getElement(data.element), `${data.name} has a known element`);
    assert.ok(getPlanet(data.ruling_planet), `${data.name} has a known ruling planet`);
  }
});

test("chakra reference data exposes all eight indexed entries", () => {
  assert.deepEqual(CHAKRAS.map(({ data }) => data.slug), [
    "muladhara", "svadhisthana", "manipura", "anahata",
    "thymus-etheric-heart", "vishuddha", "ajna", "sahasrara",
  ]);
  assert.equal(getChakra("ajna")?.common_name, "Third Eye Chakra");
  assert.equal(getChakraPlanetLinks("muladhara")[0]?.slug, "saturn");
  assert.deepEqual(getChakraZodiacLinks("anahata").map(({ slug }) => slug), ["libra", "taurus", "cancer"]);
  assert.equal(chakraReferenceHref("Svadhisthana"), "/chakras/svadhisthana/");
});
