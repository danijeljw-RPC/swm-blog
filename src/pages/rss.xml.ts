import { getCollection } from "astro:content";

import { site } from "../config/site";
import { podcast } from "../config/podcast";
import { getPublishedEpisodes } from "../utils/episodes";
import { serializePodcastRss } from "../utils/rss";

export async function GET() {
  const episodes = getPublishedEpisodes(await getCollection("episodes"));
  const xml = serializePodcastRss(
    {
      title: podcast.name,
      link: site.url,
      selfUrl: new URL(site.rssPath, site.url).toString(),
      description: podcast.description,
      language: podcast.language,
      author: podcast.author,
      artwork: podcast.artwork,
      ownerName: podcast.ownerName,
      ownerEmail: podcast.ownerEmail,
      explicit: podcast.explicit,
    },
    episodes,
  );

  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
  });
}
