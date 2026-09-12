import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";

interface PlaceRow {
    id: number;
    name: string;
    region: string | null;
    country: string;
    country_code: string;
    latitude: number;
    longitude: number;
    timezone: string;
    population: number;
}

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const query = url.searchParams.get("q")?.trim() ?? "";

    if (query.length < 2) {
        return Response.json([]);
    }

    const search = query.slice(0, 100);
    const prefix = `${search}%`;

    if (!env.swm_places) {
        return Response.json([]);
    }

    const result = await env.swm_places
        .prepare(`
            SELECT
                id,
                name,
                region,
                country,
                country_code,
                latitude,
                longitude,
                timezone,
                population
            FROM places
            WHERE
                ascii_name LIKE ?1 COLLATE NOCASE
                OR name LIKE ?1 COLLATE NOCASE
            ORDER BY
                CASE
                    WHEN ascii_name = ?2 COLLATE NOCASE THEN 0
                    WHEN name = ?2 COLLATE NOCASE THEN 0
                    ELSE 1
                END,
                population DESC,
                name ASC
            LIMIT 10
        `)
        .bind(prefix, search)
        .all<PlaceRow>();

    return Response.json(
        result.results.map(row => ({
            id: row.id,
            name: row.name,
            region: row.region,
            country: row.country,
            countryCode: row.country_code,
            latitude: row.latitude,
            longitude: row.longitude,
            timezone: row.timezone,
            population: row.population
        })),
        {
            headers: {
                "Cache-Control": "public, max-age=300"
            }
        }
    );
};
