import type { CategoryKey } from "../config/categories";
import { getPublishedArticles, type ArticleLike } from "./articles";
import { getPublishedEpisodes, type EpisodeLike } from "./episodes";

export type CategoryEntry<E, A> = { kind: "episode"; entry: E } | { kind: "article"; entry: A };

export function getEntriesByCategory<E extends EpisodeLike, A extends ArticleLike>(episodes: readonly E[], articles: readonly A[], category: CategoryKey): CategoryEntry<E, A>[] {
  return [
    ...getPublishedEpisodes(episodes).filter(({ data }) => data.categories.includes(category)).map((entry) => ({ kind: "episode" as const, entry })),
    ...getPublishedArticles(articles).filter(({ data }) => data.categories.includes(category)).map((entry) => ({ kind: "article" as const, entry })),
  ].toSorted((left, right) => right.entry.data.publishedAt.getTime() - left.entry.data.publishedAt.getTime() || left.entry.data.slug.localeCompare(right.entry.data.slug));
}
