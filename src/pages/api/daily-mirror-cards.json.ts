import cards from "../../data/tarot/cards.json";

export const prerender = true;

export function GET() {
  const dailyMirrorCards = cards.map((card) => ({
    name: card.name,
    arcana: card.arcana,
    element: card.element,
    image: card.image,
    meaning_upright: card.meaning_upright,
    meaning_reversed: card.meaning_reversed,
    chakra: card.chakra,
    chakra_place: card.chakra_place,
    chakra_image: card.chakra_image,
    question_answer: card.question_answer,
    timing: card.timing,
    planet: card.planet,
    zodiac_sign: card.zodiac_sign,
    zodiac_elements: card.zodiac_elements,
    affirmation: card.affirmation,
  }));
  return new Response(JSON.stringify(dailyMirrorCards), { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
