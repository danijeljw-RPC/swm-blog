import { getCollection } from "astro:content";

import { site } from "../../config/site";
import { getPublishedEpisodes } from "../../utils/episodes";
import { serializeUrlSet } from "../../utils/sitemap";

const EPISODES_PER_SITEMAP = 10_000;

export async function GET({ params }: { params: { page?: string } }) {
  const page = Number.parseInt(params.page ?? "", 10);
  if (!Number.isInteger(page) || page < 1) return new Response("Not found", { status: 404 });

  const episodes = getPublishedEpisodes(await getCollection("episodes"));
  const start = (page - 1) * EPISODES_PER_SITEMAP;
  const entries = episodes.slice(start, start + EPISODES_PER_SITEMAP).map(({ data }) => ({
    loc: new URL(`/episodes/${data.slug}/`, site.url).toString(),
    lastmod: data.updatedAt ?? data.publishedAt,
  }));
  if (entries.length === 0) return new Response("Not found", { status: 404 });

  return new Response(serializeUrlSet(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
