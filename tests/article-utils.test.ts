import assert from "node:assert/strict";
import test from "node:test";

import { getArticlesByCategory, getPublishedArticles } from "../src/utils/articles.ts";

const article = (slug: string, publishedAt: string, draft = false, categories = ["spirituality"]) => ({
  data: { slug, publishedAt: new Date(publishedAt), draft, categories },
});

test("published articles exclude drafts and sort newest first", () => {
  const entries = [article("older", "2026-01-01"), article("draft", "2026-03-01", true), article("newer", "2026-02-01")];
  assert.deepEqual(getPublishedArticles(entries).map(({ data }) => data.slug), ["newer", "older"]);
});

test("articles by category use the shared exact category key", () => {
  const entries = [article("match", "2026-01-01", false, ["spirituality"]), article("other", "2026-02-01", false, ["energy"] )];
  assert.deepEqual(getArticlesByCategory(entries, "spirituality").map(({ data }) => data.slug), ["match"]);
});
