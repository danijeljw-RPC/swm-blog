export const ZODIAC_SIGNS = [
  { slug: "aries", name: "Aries", dateRange: "March 21 – April 19" },
  { slug: "taurus", name: "Taurus", dateRange: "April 20 – May 20" },
  { slug: "gemini", name: "Gemini", dateRange: "May 21 – June 20" },
  { slug: "cancer", name: "Cancer", dateRange: "June 21 – July 21" },
  { slug: "leo", name: "Leo", dateRange: "July 22 – August 22" },
  { slug: "virgo", name: "Virgo", dateRange: "August 23 – September 22" },
  { slug: "libra", name: "Libra", dateRange: "September 23 – October 22" },
  { slug: "scorpio", name: "Scorpio", dateRange: "October 23 – November 22" },
  { slug: "sagittarius", name: "Sagittarius", dateRange: "November 23 – December 21" },
  { slug: "capricorn", name: "Capricorn", dateRange: "December 22 – January 19" },
  { slug: "aquarius", name: "Aquarius", dateRange: "January 20 – February 18" },
  { slug: "pisces", name: "Pisces", dateRange: "February 19 – March 20" },
] as const;

export type ZodiacSlug = (typeof ZODIAC_SIGNS)[number]["slug"];

export function getZodiacSign(slug: string | undefined) {
  return ZODIAC_SIGNS.find((sign) => sign.slug === slug);
}
