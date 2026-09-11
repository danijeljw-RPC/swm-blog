export type EpisodeDownloadKind = "audio" | "video";

type Fetcher = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

const extensionFor = (kind: EpisodeDownloadKind) => kind === "audio" ? "mp3" : "mp4";

export async function createEpisodeDownloadResponse(
  slug: string,
  kind: EpisodeDownloadKind,
  mediaUrl: string | null | undefined,
  fetcher: Fetcher = fetch,
) {
  if (!mediaUrl) return new Response("Not found", { status: 404 });

  const media = await fetcher(mediaUrl);
  if (!media.ok) return new Response("Media unavailable", { status: 502 });

  const headers = new Headers({
    "Content-Disposition": `attachment; filename="${slug}.${extensionFor(kind)}"`,
    "Content-Type": media.headers.get("Content-Type") ?? "application/octet-stream",
    "X-Content-Type-Options": "nosniff",
  });
  const contentLength = media.headers.get("Content-Length");
  if (contentLength) headers.set("Content-Length", contentLength);

  return new Response(media.body, { headers });
}
