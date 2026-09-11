import { site } from "../../config/site";
import { serializeUrlSet } from "../../utils/sitemap";

const paths = ["/", "/about/", "/astrology/", "/categories/", "/chakras/", "/daily-mirror/", "/episodes/", "/hosts/", "/listen/"];

export function GET() {
  return new Response(
    serializeUrlSet(paths.map((path) => ({ loc: new URL(path, site.url).toString() }))),
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
