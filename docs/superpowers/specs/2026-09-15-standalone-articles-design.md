# Standalone Blog Articles Design

## Purpose

Add first-class, non-podcast articles without weakening the existing distinction between podcast episodes and written blog content. Episodes remain podcast entries with media-specific metadata and routes. Standalone articles become a separate content type with their own section and routes.

## Content architecture

Astro will expose two collections:

- `episodes`, loaded from `src/content/episodes/`, retaining its existing schema and publication behavior.
- `articles`, loaded from `src/content/articles/`, with article-specific metadata and no podcast or media fields.

Published articles require:

- `title`
- URL-safe `slug`
- `publishedAt`
- `excerpt`
- `description`
- at least one category from the existing shared category taxonomy
- at least one author, restricted to `dj` and `warren`; both are allowed for co-authored work

Articles also support `updatedAt`, `draft`, tags, hero image and alt text, and the existing SEO canonical/no-index controls. Hero image alt text is required whenever a hero image is present.

## Site presentation

Standalone articles will have:

- an `/articles/` listing, newest first;
- an `/articles/[slug]/` detail route that renders Markdown or MDX;
- an article layout that presents title, publication date, authors, categories, hero image, and body without episode numbering or media controls;
- an `Articles` navigation link;
- sitemap discovery for the listing and every published article.

Reusable article cards will label entries as articles. Shared category pages will combine published episodes and articles in reverse chronological order and clearly label each content type. Category counts will describe the combined number of entries rather than episodes alone.

## Feed contracts

`/rss.xml` remains the podcast feed. It reads only the `episodes` collection and preserves all existing enclosure, duration, and podcast metadata behavior.

`/blog.xml` becomes the combined written-content feed. A shared blog-entry normalizer will map published episodes and articles to a common representation containing title, description, publication date, and the correct canonical route. The combined entries will be sorted newest first by `publishedAt`, with a deterministic tie-breaker, and limited to the newest 100 only after merging and sorting.

Episode feed links use `/episodes/[slug]/`. Standalone article feed links use `/articles/[slug]/`.

## Validation and failure behavior

The content schema rejects missing authors, unknown author keys, unknown categories, malformed slugs, and hero images without alt text. Draft articles are excluded from routes, listings, category pages, feeds, and article sitemaps.

The repository content validator will validate article files in addition to episode files while keeping episode-only media checks scoped to episodes.

## Verification

Automated coverage will verify:

- article publication filtering and chronological sorting;
- required and valid authors;
- shared-category aggregation with correct content labels and links;
- combined `/blog.xml` ordering and route generation;
- strict exclusion of articles from `/rss.xml`;
- article navigation and sitemap discovery;
- Astro content schema/type correctness and a clean production build.

The complete repository test, content-validation, Astro check, and production build commands must pass without errors or warnings before completion is reported.
