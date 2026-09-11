import fs from "node:fs";
import YAML from "yaml";

const cardsPath = "src/data/tarot/cards.json";
const chakraData = YAML.parse(fs.readFileSync("chakra_data.yaml", "utf8"));
const assignments = YAML.parse(fs.readFileSync("card-chakra-assigned.yaml", "utf8"));
const numberNames = new Map([["2", "Two"], ["3", "Three"], ["4", "Four"], ["5", "Five"], ["6", "Six"], ["7", "Seven"], ["8", "Eight"], ["9", "Nine"], ["10", "Ten"]]);
const canonicalName = (name) => name.replace(/^(\d+) of /, (_, number) => `${numberNames.get(number)} of `);
const cardAssignments = new Map();

for (const [chakra, names] of Object.entries(assignments)) {
  for (const rawName of names ?? []) {
    if (!rawName) continue;
    const name = canonicalName(rawName);
    if (cardAssignments.has(name)) throw new Error(`Duplicate chakra assignment for ${name}`);
    cardAssignments.set(name, chakra);
  }
}

const cards = JSON.parse(fs.readFileSync(cardsPath, "utf8"));
const metadata = new Map(Object.entries(chakraData).map(([key, values]) => [key, values[0]]));
for (const card of cards) {
  const chakra = cardAssignments.get(card.name);
  if (!chakra) throw new Error(`No chakra assignment for ${card.name}`);
  const details = metadata.get(chakra);
  if (!details) throw new Error(`No chakra metadata for ${chakra}`);
  card.chakra = details.name;
  card.chakra_place = details.place;
  card.chakra_image = details.image;
}

fs.writeFileSync(cardsPath, `${JSON.stringify(cards, null, 2)}\n`);
console.log(`Applied chakra metadata to ${cards.length} tarot cards; ${metadata.size} chakra definitions loaded.`);
