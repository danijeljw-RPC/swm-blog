import { getCollection } from "astro:content";

import { site } from "../config/site";
import { getPublishedEpisodes } from "../utils/episodes";
import { serializePodcastRss } from "../utils/rss";

export async function GET() {
  const episodes = getPublishedEpisodes(await getCollection("episodes"));
  const xml = serializePodcastRss(
    {
      title: site.name,
      link: site.url,
      selfUrl: new URL(site.rssPath, site.url).toString(),
      description: site.description,
      language: site.language,
    },
    episodes,
  );

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
