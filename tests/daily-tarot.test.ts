import assert from "node:assert/strict";
import test from "node:test";

import { getDailyTarotDraw } from "../src/lib/tarot/daily-tarot.ts";

test("a timezone receives one repeatable draw for its local date", async () => {
  const first = await getDailyTarotDraw("2026-09-13", "Australia/Adelaide", 78);
  const second = await getDailyTarotDraw("2026-09-13", "Australia/Adelaide", 78);

  assert.deepEqual(first, second);
  assert.equal(first.cardIndex, 63);
  assert.equal(first.orientation, "reversed");
});

test("the timezone participates in the draw seed", async () => {
  const adelaide = await getDailyTarotDraw("2026-09-13", "Australia/Adelaide", 78);
  const sydney = await getDailyTarotDraw("2026-09-13", "Australia/Sydney", 78);

  assert.notDeepEqual(adelaide, sydney);
});

test("a timezone draws each card once before reshuffling the deck", async () => {
  for (const timeZone of ["Australia/Adelaide", "Australia/Sydney", "America/New_York"]) {
    const draws = await Promise.all(Array.from({ length: 78 }, (_, offset) => {
      const date = new Date(Date.UTC(2026, 2, 2 + offset)).toISOString().slice(0, 10);
      return getDailyTarotDraw(date, timeZone, 78);
    }));

    assert.equal(new Set(draws.map(({ cardIndex }) => cardIndex)).size, 78, timeZone);
  }
});

test("reshuffling cannot repeat the last card from the previous deck", async () => {
  const beforeReshuffle = await getDailyTarotDraw("1989-06-07", "Australia/Adelaide", 78);
  const afterReshuffle = await getDailyTarotDraw("1989-06-08", "Australia/Adelaide", 78);
  const secondDraw = await getDailyTarotDraw("1989-06-09", "Australia/Adelaide", 78);

  assert.notEqual(afterReshuffle.cardIndex, beforeReshuffle.cardIndex);
  assert.notEqual(secondDraw.cardIndex, afterReshuffle.cardIndex);
});

test("daily draws do not walk through deck order or force alternating orientation", async () => {
  const draws = await Promise.all(
    ["2026-09-11", "2026-09-12", "2026-09-13", "2026-09-14"].map((date) =>
      getDailyTarotDraw(date, "Australia/Adelaide", 78)),
  );

  assert.deepEqual(draws.map((draw) => draw.cardIndex), [57, 66, 63, 71]);
  assert.deepEqual(draws.map((draw) => draw.orientation), ["upright", "upright", "reversed", "reversed"]);
});

test("the selector rejects invalid deck sizes", async () => {
  await assert.rejects(() => getDailyTarotDraw("2026-09-13", "UTC", 1), /at least two cards/);
});
