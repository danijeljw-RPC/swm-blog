# Standalone Blog Articles Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-class standalone article collection and section while combining articles and episode articles in `/blog.xml` and keeping `/rss.xml` podcast-only.

**Architecture:** Keep Astro `episodes` and `articles` as distinct collections and normalize their published entries only where mixed presentation is required. Article-specific utilities, types, cards, and layout own article behavior; a shared blog-entry utility owns cross-collection sorting and URLs.

**Tech Stack:** Astro 7 content collections, TypeScript 6, Markdown/MDX, Node test runner, Zod.

**Spec:** `docs/superpowers/specs/2026-09-15-standalone-articles-design.md`

## Global Constraints

- Standalone article source files live in `src/content/articles/`.
- Article `authors` are required, contain at least one entry, and permit only `dj` and `warren`.
- Episodes and articles share `src/config/categories.json`.
- `/blog.xml` combines both collections newest-first and limits the combined result to 100.
- `/rss.xml` reads episodes only and retains its existing podcast contract.
- Draft articles do not appear in public routes, listings, category pages, feeds, or sitemaps.
- Repository tests, content validation, Astro check, and production build must finish without errors or warnings.

---

### Task 1: Article collection and publication utilities

**Files:**
- Modify: `src/content.config.ts`
- Create: `src/types/article.ts`
- Create: `src/utils/articles.ts`
- Create: `tests/article-utils.test.ts`

**Interfaces:**
- Produces: Astro collection `articles`; `ArticleEntry`; `getPublishedArticles(entries)`; `getArticlesByCategory(entries, category)`.

- [ ] **Step 1: Write failing utility tests**

Test that drafts are excluded, publication order is newest-first, and category filtering uses the shared category key.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `npm test -- --test-name-pattern="published articles|articles by category"`
Expected: FAIL because `src/utils/articles.ts` does not exist.

- [ ] **Step 3: Define the article schema and utilities**

Add a `glob` collection rooted at `src/content/articles`, exclude `*-source-data` notes, and validate the exact fields approved in the design. Define `authors` as a non-empty array of `dj | warren`, reuse `CATEGORY_KEYS`, and mirror the existing hero-image/SEO rules. Implement pure filtering and sorting utilities.

- [ ] **Step 4: Run focused tests and Astro check**

Run: `npm test -- --test-name-pattern="published articles|articles by category" && npm run check`
Expected: PASS with zero diagnostics.

- [ ] **Step 5: Commit**

```bash
git add src/content.config.ts src/types/article.ts src/utils/articles.ts tests/article-utils.test.ts
git commit -m "feat(content): add standalone article collection"
```

### Task 2: Combined blog-entry model and feed

**Files:**
- Create: `src/utils/blog-entries.ts`
- Modify: `src/utils/blog-rss.ts`
- Modify: `src/pages/blog.xml.ts`
- Modify: `tests/feed-and-sitemap-contract.test.ts`
- Create: `tests/blog-entries.test.ts`

**Interfaces:**
- Consumes: published `EpisodeEntry[]` and `ArticleEntry[]`.
- Produces: `BlogEntry` with `kind`, `title`, `description`, `publishedAt`, and `path`; `getPublishedBlogEntries(episodes, articles)`; `serializeBlogRss(channel, entries)` using `entry.path`.

- [ ] **Step 1: Write failing aggregation and serialization tests**

Cover interleaved dates, deterministic equal-date ordering, draft exclusion inherited from collection utilities, `/episodes/...` links, `/articles/...` links, and a 100-entry limit applied after sorting.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --test-name-pattern="blog entries|blog RSS"`
Expected: FAIL because mixed entries and article paths are unsupported.

- [ ] **Step 3: Implement normalized aggregation and feed routing**

Map each collection to explicit public paths, combine, sort by descending `publishedAt` then stable path order, and slice only the merged list. Change the serializer to consume the explicit path instead of assuming `/episodes/`.

- [ ] **Step 4: Run feed tests**

Run: `npm test -- --test-name-pattern="blog entries|blog RSS|RSS serialization"`
Expected: PASS, including the unchanged podcast RSS contract tests.

- [ ] **Step 5: Commit**

```bash
git add src/utils/blog-entries.ts src/utils/blog-rss.ts src/pages/blog.xml.ts tests/blog-entries.test.ts tests/feed-and-sitemap-contract.test.ts
git commit -m "feat(feeds): combine episodes and articles in blog RSS"
```

### Task 3: Article listing and detail presentation

**Files:**
- Create: `src/components/articles/ArticleCard.astro`
- Create: `src/layouts/ArticleLayout.astro`
- Create: `src/pages/articles/index.astro`
- Create: `src/pages/articles/[slug].astro`
- Create: `tests/article-pages.test.ts`

**Interfaces:**
- Consumes: `ArticleEntry`, shared `CategoryBadge`, host records from `src/data/hosts.json`, and `getPublishedArticles`.
- Produces: `/articles/` and `/articles/[slug]/` pages with article-specific labels and author attribution.

- [ ] **Step 1: Write failing page-contract tests**

Assert the collection lookup, article route, author rendering for one or two authors, absence of episode/media language, and article-card links.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --test-name-pattern="article pages"`
Expected: FAIL because the article presentation files do not exist.

- [ ] **Step 3: Implement article UI**

Follow existing episode typography and responsive image treatment while keeping article semantics independent. Resolve author IDs to host names, render co-authors in source order, and use the shared category badges.

- [ ] **Step 4: Run page tests and Astro check**

Run: `npm test -- --test-name-pattern="article pages" && npm run check`
Expected: PASS with zero diagnostics.

- [ ] **Step 5: Commit**

```bash
git add src/components/articles/ArticleCard.astro src/layouts/ArticleLayout.astro src/pages/articles tests/article-pages.test.ts
git commit -m "feat(articles): add standalone article section"
```

### Task 4: Shared taxonomy presentation

**Files:**
- Create: `src/components/common/ContentCard.astro`
- Modify: `src/pages/categories/index.astro`
- Modify: `src/pages/categories/[category].astro`
- Create: `src/utils/category-entries.ts`
- Create: `tests/category-content.test.ts`

**Interfaces:**
- Consumes: published episodes and articles.
- Produces: `getEntriesByCategory(episodes, articles, category)` returning chronological discriminated entries; combined category counts and cards labelled `Episode` or `Article`.

- [ ] **Step 1: Write failing category aggregation tests**

Cover shared category filtering, interleaved chronology, type labels, correct route prefixes, and combined count wording (`entry`/`entries`).

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --test-name-pattern="category content"`
Expected: FAIL because mixed category entries are unsupported.

- [ ] **Step 3: Implement mixed category presentation**

Build a discriminated normalized view model and one compact shared card for mixed lists. Preserve the richer collection-specific cards on `/episodes/` and `/articles/`.

- [ ] **Step 4: Run focused tests and Astro check**

Run: `npm test -- --test-name-pattern="category content" && npm run check`
Expected: PASS with zero diagnostics.

- [ ] **Step 5: Commit**

```bash
git add src/components/common/ContentCard.astro src/pages/categories src/utils/category-entries.ts tests/category-content.test.ts
git commit -m "feat(categories): combine episodes and articles"
```

### Task 5: Navigation, sitemap, and content validation

**Files:**
- Modify: `src/components/layout/Header.astro`
- Modify: `src/components/layout/Footer.astro`
- Modify: `src/pages/sitemaps/pages.xml.ts`
- Create: `src/pages/sitemaps/articles-[page].xml.ts`
- Modify: `src/pages/sitemap-index.xml.ts`
- Modify: `scripts/lib/content-validation.mjs`
- Modify: `tests/navigation-links.test.ts`
- Modify: `tests/content-validation.test.mjs`
- Modify: `tests/feed-and-sitemap-contract.test.ts`
- Create: `src/content/articles/.gitkeep`

**Interfaces:**
- Consumes: `getPublishedArticles`, article schema constraints, and the existing sitemap serializers.
- Produces: discoverable Articles navigation; paginated article sitemap entries; validator errors for missing/invalid authors, categories, slugs, and artwork.

- [ ] **Step 1: Write failing discovery and validation tests**

Assert `/articles/` in header, footer, and static pages sitemap; article sitemap indexing and URLs; required author arrays; rejection of unknown hosts/categories; draft-safe publication; and unchanged episode-only podcast RSS source.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `npm test -- --test-name-pattern="articles navigation|article content validation|article sitemap|RSS serialization"`
Expected: FAIL for missing navigation, sitemap, and validator support while existing RSS tests remain green.

- [ ] **Step 3: Implement discovery and validation**

Add article navigation and sitemap routing. Extend validation with an article-specific shape validator and cross-collection slug uniqueness while leaving all media, episode-number, and enclosure checks episode-only.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- --test-name-pattern="articles navigation|article content validation|article sitemap|RSS serialization"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout src/pages/sitemap-index.xml.ts src/pages/sitemaps scripts/lib/content-validation.mjs tests src/content/articles/.gitkeep
git commit -m "feat(articles): add discovery and validation"
```

### Task 6: Documentation and complete verification

**Files:**
- Modify: `docs/content-authoring.md`

**Interfaces:**
- Produces: author instructions for standalone articles and an evidence-backed verified implementation.

- [ ] **Step 1: Document the exact article frontmatter and feed boundaries**

Include a copyable article example with required authors, shared categories, draft behavior, `/articles/` routing, combined `/blog.xml`, and episode-only `/rss.xml`.

- [ ] **Step 2: Run formatting and diff checks**

Run: `git diff --check`
Expected: no output.

- [ ] **Step 3: Run the complete verification pipeline**

Run: `npm test && npm run validate:content && npm run check && npm run build`
Expected: every command exits 0 with no errors or warnings.

- [ ] **Step 4: Inspect generated routes and feeds**

Confirm the build output includes `/articles/`, the article sitemap, combined `/blog.xml`, and that `/rss.xml` contains no `/articles/` links.

- [ ] **Step 5: Commit**

```bash
git add docs/content-authoring.md
git commit -m "docs: explain standalone article authoring"
```
