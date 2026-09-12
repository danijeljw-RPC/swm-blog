import type { PlaceSearchResult } from "./types";

export async function searchPlaces(
    query: string,
    signal?: AbortSignal
): Promise<PlaceSearchResult[]> {
    const value = query.trim();

    if (value.length < 2) {
        return [];
    }

    const response = await fetch(
        `/api/places/?q=${encodeURIComponent(value)}`,
        { signal }
    );

    if (!response.ok) {
        throw new Error(`Place lookup failed: ${response.status}`);
    }

    return await response.json() as PlaceSearchResult[];
}
