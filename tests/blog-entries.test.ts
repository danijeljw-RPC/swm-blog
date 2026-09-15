import assert from "node:assert/strict";
import test from "node:test";

import { getPublishedBlogEntries } from "../src/utils/blog-entries.ts";

const entry = (slug: string, date: string, draft = false) => ({ data: { title: slug, slug, description: slug, publishedAt: new Date(date), draft, categories: [] } });

test("blog entries combine episodes and articles in reverse chronology with correct paths", () => {
  const result = getPublishedBlogEntries([entry("episode", "2026-01-02")], [entry("article", "2026-01-03"), entry("draft", "2026-01-04", true)]);
  assert.deepEqual(result.map(({ kind, path }) => [kind, path]), [["article", "/articles/article/"], ["episode", "/episodes/episode/"]]);
});

test("blog entries sort equal dates deterministically and limit after merging", () => {
  const episodes = Array.from({ length: 60 }, (_, index) => entry(`episode-${String(index).padStart(2, "0")}`, "2026-01-01"));
  const articles = Array.from({ length: 60 }, (_, index) => entry(`article-${String(index).padStart(2, "0")}`, "2026-01-01"));
  const result = getPublishedBlogEntries(episodes, articles);
  assert.equal(result.length, 100);
  assert.deepEqual(result.slice(0, 2).map(({ path }) => path), ["/articles/article-00/", "/articles/article-01/"]);
});
