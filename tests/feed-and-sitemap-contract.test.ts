import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { serializeBlogRss } from "../src/utils/blog-rss.ts";
import { serializeSitemapIndex, serializeUrlSet } from "../src/utils/sitemap.ts";

test("blog RSS emits article links without podcast enclosures", () => {
  const xml = serializeBlogRss(
    {
      title: "Sisters with Mirrors",
      link: "https://sisterswithmirrors.com",
      selfUrl: "https://sisterswithmirrors.com/blog.xml",
      description: "Weekly articles",
      language: "en-AU",
    },
    [{
      title: "Episode & one",
      path: "/episodes/episode-one/",
      description: "A < reflection",
      publishedAt: new Date("2026-09-05T00:00:00Z"),
    }],
  );

  assert.match(xml, /<atom:link href="https:\/\/sisterswithmirrors\.com\/blog\.xml" rel="self" type="application\/rss\+xml" \/>/);
  assert.match(xml, /<link>https:\/\/sisterswithmirrors\.com\/episodes\/episode-one\/<\/link>/);
  assert.match(xml, /<title>Episode &amp; one<\/title>/);
  assert.doesNotMatch(xml, /<enclosure /);
});

test("blog RSS preserves explicit article routes", () => {
  const xml = serializeBlogRss(
    { title: "Sisters with Mirrors", link: "https://sisterswithmirrors.com", selfUrl: "https://sisterswithmirrors.com/blog.xml", description: "Articles", language: "en-AU" },
    [{ title: "Written", path: "/articles/written/", description: "Article", publishedAt: new Date("2026-09-15T00:00:00Z") }],
  );
  assert.match(xml, /https:\/\/sisterswithmirrors\.com\/articles\/written\//);
  assert.doesNotMatch(xml, /\/episodes\/written\//);
});

test("sitemap index and URL set escape values and preserve last modification dates", () => {
  const index = serializeSitemapIndex([{
    loc: "https://sisterswithmirrors.com/sitemaps/episodes-1.xml",
    lastmod: new Date("2026-09-11T00:00:00Z"),
  }]);
  const urls = serializeUrlSet([{
    loc: "https://sisterswithmirrors.com/episodes/one/?source=a&b=c",
    lastmod: new Date("2026-09-10T00:00:00Z"),
  }]);

  assert.match(index, /<sitemapindex xmlns="http:\/\/www\.sitemaps\.org\/schemas\/sitemap\/0\.9">/);
  assert.match(index, /<lastmod>2026-09-11<\/lastmod>/);
  assert.match(urls, /source=a&amp;b=c/);
  assert.match(urls, /<lastmod>2026-09-10<\/lastmod>/);
});

test("robots.txt advertises the sitemap index", async () => {
  const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
  assert.match(robots, /^Sitemap: https:\/\/sisterswithmirrors\.com\/sitemap-index\.xml$/m);
});
