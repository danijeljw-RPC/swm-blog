import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("article pages use their own collection, routes, layout, and required authors", async () => {
  const [index, detail, layout, card, config] = await Promise.all([
    read("src/pages/articles/index.astro"), read("src/pages/articles/[slug].astro"),
    read("src/layouts/ArticleLayout.astro"), read("src/components/articles/ArticleCard.astro"), read("src/content.config.ts"),
  ]);
  assert.match(index, /getCollection\("articles"\)/);
  assert.match(detail, /ArticleLayout/);
  assert.match(layout, /data\.authors/);
  assert.doesNotMatch(layout, /EpisodeMediaPanel|Episode \{data\.episode\}/);
  assert.match(card, /\/articles\/\$\{data\.slug\}\//);
  assert.match(config, /authors: z\.array\(z\.enum\(\["dj", "warren"\]\)\)\.min\(1\)/);
});

test("articles are discoverable and podcast RSS remains episode-only", async () => {
  const [header, footer, pages, rss, blog] = await Promise.all([
    read("src/components/layout/Header.astro"), read("src/components/layout/Footer.astro"),
    read("src/pages/sitemaps/pages.xml.ts"), read("src/pages/rss.xml.ts"), read("src/pages/blog.xml.ts"),
  ]);
  for (const source of [header, footer, pages]) assert.match(source, /\/articles\//);
  assert.doesNotMatch(rss, /getCollection\("articles"\)/);
  assert.match(blog, /getCollection\("articles"\)/);
});
