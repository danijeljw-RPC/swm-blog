import fs from "node:fs";
import YAML from "yaml";

const cardsPath = "src/data/tarot/cards.json";
const sourcePath = "tarot-celestial-data.txt";
const zodiacElements = YAML.parse(fs.readFileSync("zodiac_element.yaml", "utf8")).zodiac;
const planets = new Set(["chiron", "jupiter", "mars", "mercury", "moon", "neptune", "pluto", "saturn", "sun", "uranus", "venus"]);
const zodiacByLowercase = new Map(Object.keys(zodiacElements).map((sign) => [sign, sign[0].toUpperCase() + sign.slice(1)]));
const numberWords = new Map([["2", "two"], ["3", "three"], ["4", "four"], ["5", "five"], ["6", "six"], ["7", "seven"], ["8", "eight"], ["9", "nine"], ["10", "ten"]]);

const normalizeName = (value) => value.toLowerCase()
  .replace(/^the\s+/, "")
  .replace(/^(\d+)/, (_, number) => numberWords.get(number) ?? number)
  .replace(/\bof\b/g, "")
  .replace(/[^a-z]/g, "");
const titleCase = (value) => value[0].toUpperCase() + value.slice(1);

const source = new Map();
for (const block of fs.readFileSync(sourcePath, "utf8").trim().split(/\n\s*\n/)) {
  const [heading, ...lines] = block.split("\n");
  const associations = lines.filter((line) => line.startsWith("-")).map((line) => line.slice(1).trim().toLowerCase());
  source.set(normalizeName(heading.replace(/:$/, "")), associations);
}

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
let merged = 0;
for (const card of cards) {
  const associations = source.get(normalizeName(card.name));
  if (!associations) throw new Error(`No authoritative celestial source entry for ${card.name}`);
  const unknown = associations.filter((value) => !planets.has(value) && !zodiacByLowercase.has(value));
  if (unknown.length > 0) throw new Error(`Unknown celestial association for ${card.name}: ${unknown.join(", ")}`);
  const cardPlanets = associations.filter((value) => planets.has(value)).map(titleCase);
  const cardZodiac = associations.filter((value) => zodiacByLowercase.has(value)).map((value) => zodiacByLowercase.get(value));
  card.planet = cardPlanets.length === 0 ? null : cardPlanets;
  card.zodiac_sign = cardZodiac.length === 0 ? null : cardZodiac;
  merged += 1;

  card.zodiac_elements = card.zodiac_sign === null ? null : [...new Set(card.zodiac_sign.map((sign) => {
    const element = zodiacElements[sign.toLowerCase()].element;
    return element[0].toUpperCase() + element.slice(1);
  }))];
  delete card.zodiac_element;
}

fs.writeFileSync(cardsPath, `${JSON.stringify(cards, null, 2)}\n`);
console.log(`Replaced celestial associations from source for ${merged} cards.`);
