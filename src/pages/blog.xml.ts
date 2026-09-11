import { getCollection } from "astro:content";

import { site } from "../config/site";
import { getPublishedEpisodes } from "../utils/episodes";
import { serializeBlogRss } from "../utils/blog-rss";

export async function GET() {
  const xml = serializeBlogRss(
    {
      title: `${site.name} blog`,
      link: site.url,
      selfUrl: new URL("/blog.xml", site.url).toString(),
      description: site.description,
      language: site.language,
    },
    getPublishedEpisodes(await getCollection("episodes")).slice(0, 100).map(({ data }) => ({
      title: data.title,
      slug: data.slug,
      description: data.description,
      publishedAt: data.publishedAt,
    })),
  );

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
