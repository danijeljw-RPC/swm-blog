import type { CategoryKey } from "../config/categories";

export interface EpisodeLike {
  data: {
    categories: readonly string[];
    draft: boolean;
    publishedAt: Date;
    slug: string;
  };
}

export function getPublishedEpisodes<T extends EpisodeLike>(entries: readonly T[]): T[] {
  return entries
    .filter((entry) => !entry.data.draft)
    .toSorted(
      (left, right) =>
        right.data.publishedAt.getTime() - left.data.publishedAt.getTime(),
    );
}

export function getEpisodesByCategory<T extends EpisodeLike>(
  entries: readonly T[],
  category: CategoryKey,
): T[] {
  return getPublishedEpisodes(entries).filter((entry) =>
    entry.data.categories.includes(category),
  );
}
