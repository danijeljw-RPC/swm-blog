import { getCollection } from "astro:content";
import { site } from "../../config/site";
import { getPublishedArticles } from "../../utils/articles";
import { serializeUrlSet } from "../../utils/sitemap";

const ENTRIES_PER_SITEMAP = 10_000;
export const prerender = true;

export async function getStaticPaths() {
  const count = getPublishedArticles(await getCollection("articles")).length;
  return Array.from({ length: Math.ceil(count / ENTRIES_PER_SITEMAP) }, (_, index) => ({ params: { page: String(index + 1) } }));
}

export async function GET({ params }: { params: { page?: string } }) {
  const page = Number(params.page);
  const articles = getPublishedArticles(await getCollection("articles"));
  const start = (page - 1) * ENTRIES_PER_SITEMAP;
  const entries = articles.slice(start, start + ENTRIES_PER_SITEMAP).map(({ data }) => ({
    loc: new URL(`/articles/${data.slug}/`, site.url).toString(),
    lastmod: data.updatedAt ?? data.publishedAt,
  }));
  return new Response(serializeUrlSet(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
