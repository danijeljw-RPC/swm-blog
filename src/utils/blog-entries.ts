import { getPublishedArticles, type ArticleLike } from "./articles";
import { getPublishedEpisodes, type EpisodeLike } from "./episodes";

interface FeedLike { data: { title: string; slug: string; description: string; publishedAt: Date; draft: boolean; categories: readonly string[] } }
export interface BlogEntry { kind: "article" | "episode"; title: string; path: string; description: string; publishedAt: Date }

export function getPublishedBlogEntries<E extends EpisodeLike & FeedLike, A extends ArticleLike & FeedLike>(episodes: readonly E[], articles: readonly A[]): BlogEntry[] {
  return [
    ...getPublishedEpisodes(episodes).map(({ data }) => ({ kind: "episode" as const, title: data.title, path: `/episodes/${data.slug}/`, description: data.description, publishedAt: data.publishedAt })),
    ...getPublishedArticles(articles).map(({ data }) => ({ kind: "article" as const, title: data.title, path: `/articles/${data.slug}/`, description: data.description, publishedAt: data.publishedAt })),
  ].toSorted((left, right) => right.publishedAt.getTime() - left.publishedAt.getTime() || left.path.localeCompare(right.path)).slice(0, 100);
}
