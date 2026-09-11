import { readFile } from "node:fs/promises";

const categoriesUrl = new URL("../../src/config/categories.json", import.meta.url);
const categoryData = JSON.parse(await readFile(categoriesUrl, "utf8"));

export function slugify(value) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function getCategoryKeys() {
  return Object.keys(categoryData);
}

export function parseCategories(input) {
  const allowed = new Set(getCategoryKeys());
  const categories = [...new Set(input.split(",").map((item) => item.trim()).filter(Boolean))];
  if (categories.length === 0) throw new Error("At least one category is required.");
  const unknown = categories.find((category) => !allowed.has(category));
  if (unknown) throw new Error(`Unknown category: ${unknown}`);
  return categories;
}

export function buildEpisodeFilename({ episode, publishedAt, title }) {
  return `${publishedAt}-swm-${String(episode).padStart(3, "0")}-${slugify(title)}.md`;
}

function yamlQuote(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function nullableUrl(value) {
  return value?.trim() ? yamlQuote(value.trim()) : "null";
}

export function renderEpisodeMarkdown(input) {
  const slug = slugify(input.title);
  const heroImage = input.heroImage?.trim();
  const heroImageAlt = input.heroImageAlt?.trim();
  if (heroImage && !heroImageAlt) {
    throw new Error("Hero image alt text is required when artwork is supplied.");
  }
  const audioUrl = input.audioUrl?.trim();
  const audio = audioUrl
    ? `{ url: ${yamlQuote(audioUrl)}, mimeType: 'audio/mpeg', bytes: ${input.audioBytes} }`
    : "null";

  return `---
title: ${yamlQuote(input.title)}
slug: ${yamlQuote(slug)}
episode: ${input.episode}
publishedAt: ${input.publishedAt}
updatedAt: ${input.publishedAt}
draft: true
fixture: false
excerpt: ${yamlQuote(input.description)}
description: ${yamlQuote(input.description)}
categories:
${input.categories.map((category) => `  - ${category}`).join("\n")}
tags: []
heroImage: ${heroImage ? yamlQuote(heroImage) : "null"}
heroImageAlt: ${heroImageAlt ? yamlQuote(heroImageAlt) : "''"}
duration: null
audio: ${audio}
video:
  hosted: ${nullableUrl(input.hostedVideoUrl)}
  youtube: ${nullableUrl(input.youtubeUrl)}
  spotify: ${nullableUrl(input.spotifyUrl)}
podcast:
  guid: null
  season: ${input.season ?? 1}
  episodeType: full
  explicit: null
transcript: null
hosts:
  - dj
  - warren
seo:
  canonical: null
  noindex: false
---

## In this episode

Add the episode introduction here.

## Topics from the mirror

Add the main discussion notes here.

## Questions from the mirror

Add reflective questions here.
`;
}
