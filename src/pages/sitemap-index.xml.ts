import { getCollection } from "astro:content";

import { site } from "../config/site";
import { getPublishedEpisodes } from "../utils/episodes";
import { serializeSitemapIndex } from "../utils/sitemap";

const EPISODES_PER_SITEMAP = 10_000;

export async function GET() {
  const episodes = getPublishedEpisodes(await getCollection("episodes"));
  const entries: Array<{ loc: string; lastmod?: Date }> = [{
    loc: new URL("/sitemaps/pages.xml", site.url).toString(),
  }];
  for (let page = 1; page <= Math.ceil(episodes.length / EPISODES_PER_SITEMAP); page += 1) {
    entries.push({
      loc: new URL(`/sitemaps/episodes-${page}.xml`, site.url).toString(),
      lastmod: episodes[(page - 1) * EPISODES_PER_SITEMAP]?.data.updatedAt ?? episodes[(page - 1) * EPISODES_PER_SITEMAP]?.data.publishedAt,
    });
  }
  return new Response(serializeSitemapIndex(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
