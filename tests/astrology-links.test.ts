import assert from "node:assert/strict";
import test from "node:test";

import { astrologyReferenceHref } from "../src/utils/astrology-links.ts";

test("daily mirror correspondences link to their reference detail routes", () => {
  assert.equal(astrologyReferenceHref("planet", "Sun"), "/astrology/planets/sun/");
  assert.equal(astrologyReferenceHref("zodiac", "Sagittarius"), "/astrology/zodiac/sagittarius/");
  assert.equal(astrologyReferenceHref("element", "Air"), "/astrology/elements/air/");
});
