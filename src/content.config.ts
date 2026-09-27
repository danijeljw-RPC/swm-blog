import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import { CATEGORY_KEYS } from "./config/categories";
import { site } from "./config/site";
import { isMediaUrl, resolveMediaUrl } from "./utils/media-url";

const optionalUrl = z.url().nullable().optional();
const mediaUrl = z
  .string()
  .refine(isMediaUrl, "Media URL must be a root-relative path or an HTTPS URL")
  .transform((value) => resolveMediaUrl(value, site.mediaUrl));
const optionalMediaUrl = mediaUrl.nullable().optional();
const categoryValues = CATEGORY_KEYS as [string, ...string[]];

const episodes = defineCollection({
  loader: glob({
    base: "./src/content/episodes",
    pattern: ["**/*.{md,mdx}", "!**/*-source-data.{md,mdx}"],
  }),
  schema: z
    .object({
      title: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      episode: z.number().int().positive(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      fixture: z.boolean().default(false),
      excerpt: z.string().min(1),
      description: z.string().min(1),
      categories: z.array(z.enum(categoryValues)).min(1),
      tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).default([]),
      heroImage: z.string().startsWith("/").nullable().optional(),
      heroImageAlt: z.string().default(""),
      duration: z.string().regex(/^\d{1,3}:\d{2}(?::\d{2})?$/).nullable().optional(),
      audio: z
        .object({
          url: mediaUrl,
          mimeType: z.string().regex(/^audio\//),
          bytes: z.number().int().positive(),
        })
        .nullable()
        .optional(),
      video: z
        .object({
          hosted: optionalMediaUrl,
          youtube: optionalUrl,
          spotify: optionalUrl,
        })
        .default({}),
      podcast: z
        .object({
          guid: z.string().min(1).nullable().optional(),
          season: z.number().int().positive().default(1),
          episodeType: z.enum(["full", "trailer", "bonus"]).default("full"),
          explicit: z.boolean().nullable().optional(),
        })
        .default({ season: 1, episodeType: "full" }),
      transcript: optionalMediaUrl,
      hosts: z.array(z.enum(["dj", "warren"])).min(1),
      seo: z
        .object({
          canonical: optionalUrl,
          noindex: z.boolean().default(false),
        })
        .default({ noindex: false }),
    })
    .refine((data) => !data.heroImage || data.heroImageAlt.trim().length > 0, {
      message: "heroImageAlt is required when heroImage is set",
      path: ["heroImageAlt"],
    }),
});

const articles = defineCollection({
  loader: glob({
    base: "./src/content/articles",
    pattern: ["**/*.{md,mdx}", "!**/*-source-data.{md,mdx}"],
  }),
  schema: z
    .object({
      title: z.string().min(1),
      slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      excerpt: z.string().min(1),
      description: z.string().min(1),
      categories: z.array(z.enum(categoryValues)).min(1),
      tags: z.array(z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)).default([]),
      authors: z.array(z.enum(["dj", "warren"])).min(1),
      heroImage: z.string().startsWith("/").nullable().optional(),
      heroImageAlt: z.string().default(""),
      seo: z.object({ canonical: optionalUrl, noindex: z.boolean().default(false) }).default({ noindex: false }),
    })
    .refine((data) => !data.heroImage || data.heroImageAlt.trim().length > 0, {
      message: "heroImageAlt is required when heroImage is set",
      path: ["heroImageAlt"],
    }),
});

export const collections = { articles, episodes };
