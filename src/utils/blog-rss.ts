interface BlogChannel {
  title: string;
  link: string;
  selfUrl: string;
  description: string;
  language: string;
}

interface BlogArticle {
  title: string;
  slug: string;
  description: string;
  publishedAt: Date;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function serializeBlogRss(channel: BlogChannel, articles: readonly BlogArticle[]): string {
  const items = articles.map((article) => {
    const url = new URL(`/episodes/${article.slug}/`, channel.link).toString();
    return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <description>${escapeXml(article.description)}</description>
      <pubDate>${article.publishedAt.toUTCString()}</pubDate>
    </item>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(channel.title)}</title>
    <link>${escapeXml(channel.link)}</link>
    <description>${escapeXml(channel.description)}</description>
    <language>${escapeXml(channel.language)}</language>
    <atom:link href="${escapeXml(channel.selfUrl)}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>
`;
}
