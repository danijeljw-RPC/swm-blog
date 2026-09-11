import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const dataPath = path.join(root, "src/data/tarot/cards.json");
const imageDir = path.join(root, "public/images/tarot");

const slug = (value) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
const cardFileNames = fs.readdirSync(imageDir).filter((file) => file.endsWith(".webp"));
const images = new Map(cardFileNames.map((file) => [slug(file.replace(/\.webp$/, "").replace(/^\d+-/, "")), file]));
const minorNumbers = new Map([["Ace", "01"], ["2", "02"], ["3", "03"], ["4", "04"], ["5", "05"], ["6", "06"], ["7", "07"], ["8", "08"], ["9", "09"], ["10", "10"], ["Page", "11"], ["Knight", "12"], ["Queen", "13"], ["King", "14"]]);

const cards = JSON.parse(fs.readFileSync(dataPath, "utf8"));
for (const card of cards) {
  const imageFilename = images.get(slug(card.name)) ?? (card.suit && minorNumbers.has(card.number)
    ? `${card.suit}${minorNumbers.get(card.number)}.webp`
    : null);
  if (!imageFilename) throw new Error(`No tarot image found for ${card.name}`);

  const timing = card.timing ?? {};
  const match = timing.zodiac_window?.match(/^(.+?)\s+(\w{3})\s+(\d{1,2})[–-](\w{3})\s+(\d{1,2})$/);
  if (match) {
    const [, association, startMonth, startDay, endMonth, endDay] = match;
    const monthNumber = new Map([["Jan", "01"], ["Feb", "02"], ["Mar", "03"], ["Apr", "04"], ["May", "05"], ["Jun", "06"], ["Jul", "07"], ["Aug", "08"], ["Sep", "09"], ["Oct", "10"], ["Nov", "11"], ["Dec", "12"]]);
    timing.zodiac_window_start = `${monthNumber.get(startMonth)}-${startDay.padStart(2, "0")}`;
    timing.zodiac_window_end = `${monthNumber.get(endMonth)}-${endDay.padStart(2, "0")}`;
    timing.zodiac_association = association;
  } else {
    timing.zodiac_window_start ??= null;
    timing.zodiac_window_end ??= null;
    timing.zodiac_association ??= null;
  }

  card.image = imageFilename;
  card.chakra ??= null;
  card.chakra_place ??= null;
  card.chakra_image ??= null;
  card.question_answer = String(card.yes_no ?? "Maybe").toLowerCase();
  card.timing = timing;
}

fs.writeFileSync(dataPath, `${JSON.stringify(cards, null, 2)}\n`);
console.log(`Updated ${cards.length} tarot cards.`);
