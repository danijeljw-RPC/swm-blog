interface EnclosureData {
  audio?: {
    url?: string;
    mimeType?: string;
    bytes?: number;
  } | null;
}

export function hasCompleteEnclosure(data: EnclosureData): data is {
  audio: { url: string; mimeType: string; bytes: number };
} {
  return Boolean(
    data.audio &&
      /^https?:\/\//.test(data.audio.url ?? "") &&
      /^audio\//.test(data.audio.mimeType ?? "") &&
      Number.isInteger(data.audio.bytes) &&
      (data.audio.bytes ?? 0) > 0,
  );
}

interface RssChannel {
  title: string;
  link: string;
  selfUrl: string;
  description: string;
  language: string;
}

interface RssEpisode {
  data: EnclosureData & {
    title: string;
    slug: string;
    episode: number;
    description: string;
    publishedAt: Date;
    duration?: string | null;
  };
}

function escapeXml(value: string | number): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function serializePodcastRss(
  channel: RssChannel,
  episodes: readonly RssEpisode[],
): string {
  const items = episodes.flatMap(({ data }) => {
    if (!hasCompleteEnclosure(data)) return [];
    const episodeUrl = new URL(`/episodes/${data.slug}/`, channel.link).toString();
    const duration = data.duration
      ? `\n      <itunes:duration>${escapeXml(data.duration)}</itunes:duration>`
      : "";
    return [`
    <item>
      <title>${escapeXml(data.title)}</title>
      <link>${escapeXml(episodeUrl)}</link>
      <guid isPermaLink="true">${escapeXml(episodeUrl)}</guid>
      <description>${escapeXml(data.description)}</description>
      <pubDate>${data.publishedAt.toUTCString()}</pubDate>
      <enclosure url="${escapeXml(data.audio.url)}" length="${data.audio.bytes}" type="${escapeXml(data.audio.mimeType)}" />
      <itunes:episode>${data.episode}</itunes:episode>${duration}
    </item>`];
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:atom="http://www.w3.org/2005/Atom"
  xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd"
  xmlns:podcast="https://podcastindex.org/namespace/1.0">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>${escapeXml(channel.language)}</language>
    <atom:link href="${escapeXml(channel.selfUrl)}" rel="self" type="application/rss+xml" />
    <itunes:author>${escapeXml(channel.title)}</itunes:author>
    <itunes:type>episodic</itunes:type>${items.join("")}
  </channel>
</rss>
`;
}
