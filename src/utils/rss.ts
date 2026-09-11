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
  author?: string;
  artwork?: string;
  ownerName?: string;
  ownerEmail?: string;
  explicit?: boolean | null;
}

interface RssEpisode {
  data: EnclosureData & {
    title: string;
    slug: string;
    episode: number;
    description: string;
    publishedAt: Date;
    duration?: string | null;
    podcast?: {
      guid?: string | null;
      season?: number;
      episodeType?: "full" | "trailer" | "bonus";
      explicit?: boolean | null;
    };
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
    const guid = data.podcast?.guid ?? episodeUrl;
    const guidIsPermalink = data.podcast?.guid ? "false" : "true";
    const episodeType = data.podcast?.episodeType
      ? `\n      <itunes:episodeType>${data.podcast.episodeType}</itunes:episodeType>`
      : "";
    const explicit = typeof data.podcast?.explicit === "boolean"
      ? `\n      <itunes:explicit>${data.podcast.explicit ? "true" : "false"}</itunes:explicit>`
      : "";
    return [`
    <item>
      <title>${escapeXml(data.title)}</title>
      <link>${escapeXml(episodeUrl)}</link>
      <guid isPermaLink="${guidIsPermalink}">${escapeXml(guid)}</guid>
      <description>${escapeXml(data.description)}</description>
      <pubDate>${data.publishedAt.toUTCString()}</pubDate>
      <enclosure url="${escapeXml(data.audio.url)}" length="${data.audio.bytes}" type="${escapeXml(data.audio.mimeType)}" />
      <itunes:episode>${data.episode}</itunes:episode>${duration}${episodeType}${explicit}
    </item>`];
  });

  const artwork = channel.artwork ? `\n    <itunes:image href="${escapeXml(channel.artwork)}" />` : "";
  const owner = channel.ownerName && channel.ownerEmail
    ? `\n    <itunes:owner>\n      <itunes:name>${escapeXml(channel.ownerName)}</itunes:name>\n      <itunes:email>${escapeXml(channel.ownerEmail)}</itunes:email>\n    </itunes:owner>`
    : "";
  const explicit = typeof channel.explicit === "boolean"
    ? `\n    <itunes:explicit>${channel.explicit ? "true" : "false"}</itunes:explicit>`
    : "";

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
    <itunes:author>${escapeXml(channel.author ?? channel.title)}</itunes:author>
    <itunes:type>episodic</itunes:type>${artwork}${owner}${explicit}${items.join("")}
  </channel>
</rss>
`;
}
