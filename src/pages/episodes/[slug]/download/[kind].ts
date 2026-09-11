import { getCollection } from "astro:content";

import { createEpisodeDownloadResponse, type EpisodeDownloadKind } from "../../../../utils/episode-download";
import { getPublishedEpisodes } from "../../../../utils/episodes";

const isDownloadKind = (value: string | undefined): value is EpisodeDownloadKind => value === "audio" || value === "video";

export async function GET({ params }: { params: { slug?: string; kind?: string } }) {
  if (!isDownloadKind(params.kind) || !params.slug) return new Response("Not found", { status: 404 });

  const episode = getPublishedEpisodes(await getCollection("episodes")).find(({ data }) => data.slug === params.slug);
  if (!episode) return new Response("Not found", { status: 404 });

  const mediaUrl = params.kind === "audio" ? episode.data.audio?.url : episode.data.video.hosted;
  return createEpisodeDownloadResponse(episode.data.slug, params.kind, mediaUrl);
}
