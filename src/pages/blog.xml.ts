import { getCollection } from "astro:content";

import { site } from "../config/site";
import { getPublishedBlogEntries } from "../utils/blog-entries";
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
    getPublishedBlogEntries(await getCollection("episodes"), await getCollection("articles")),
  );

  return new Response(xml, { headers: { "Content-Type": "application/rss+xml; charset=utf-8" } });
}
