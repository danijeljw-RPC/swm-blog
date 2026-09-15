import type { CategoryKey } from "../config/categories";

export interface ArticleLike {
  data: { categories: readonly string[]; draft: boolean; publishedAt: Date; slug: string };
}

export function getPublishedArticles<T extends ArticleLike>(entries: readonly T[]): T[] {
  return entries.filter(({ data }) => !data.draft).toSorted((left, right) =>
    right.data.publishedAt.getTime() - left.data.publishedAt.getTime() || left.data.slug.localeCompare(right.data.slug));
}

export function getArticlesByCategory<T extends ArticleLike>(entries: readonly T[], category: CategoryKey): T[] {
  return getPublishedArticles(entries).filter(({ data }) => data.categories.includes(category));
}
