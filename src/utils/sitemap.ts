interface SitemapEntry {
  loc: string;
  lastmod?: Date;
}

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function lastmod(value?: Date): string {
  return value ? `\n    <lastmod>${value.toISOString().slice(0, 10)}</lastmod>` : "";
}

export function serializeSitemapIndex(entries: readonly SitemapEntry[]): string {
  const sitemaps = entries.map((entry) => `
  <sitemap>
    <loc>${escapeXml(entry.loc)}</loc>${lastmod(entry.lastmod)}
  </sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${sitemaps}
</sitemapindex>
`;
}

export function serializeUrlSet(entries: readonly SitemapEntry[]): string {
  const urls = entries.map((entry) => `
  <url>
    <loc>${escapeXml(entry.loc)}</loc>${lastmod(entry.lastmod)}
  </url>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}
</urlset>
`;
}
