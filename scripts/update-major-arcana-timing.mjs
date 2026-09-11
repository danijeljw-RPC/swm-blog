import fs from "node:fs";

const cardsPath = "src/data/tarot/cards.json";
const periods = new Map([
  ["The Emperor", ["Aries", "2024-03-21", "2024-04-19"]],
  ["The Hierophant", ["Taurus", "2024-04-20", "2024-05-20"]],
  ["The Lovers", ["Gemini", "2024-05-21", "2024-06-20"]],
  ["The Chariot", ["Cancer", "2024-06-21", "2024-07-21"]],
  ["Strength", ["Leo", "2024-07-22", "2024-08-22"]],
  ["The Hermit", ["Virgo", "2024-08-23", "2024-09-22"]],
  ["Justice", ["Libra", "2024-09-23", "2024-10-22"]],
  ["Death", ["Scorpio", "2024-10-23", "2024-11-22"]],
  ["Temperance", ["Sagittarius", "2024-11-23", "2024-12-21"]],
  ["The Devil", ["Capricorn", "2024-12-22", "2025-01-19"]],
  ["The Star", ["Aquarius", "2024-01-20", "2024-02-18"]],
  ["The Moon", ["Pisces", "2024-02-19", "2024-03-20"]],
]);

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
for (const card of cards) {
  const period = periods.get(card.name);
  if (!period) continue;
  const [zodiacAssociation, zodiacWindowStart, zodiacWindowEnd] = period;
  card.timing = { ...card.timing, zodiac_window_start: zodiacWindowStart, zodiac_window_end: zodiacWindowEnd, zodiac_association: zodiacAssociation };
}

fs.writeFileSync(cardsPath, `${JSON.stringify(cards, null, 2)}\n`);
console.log(`Updated zodiac timing for ${periods.size} Major Arcana cards.`);
