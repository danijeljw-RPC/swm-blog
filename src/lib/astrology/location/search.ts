import type { PlaceSearchResult } from "./types";

type PlaceRecord = [number, string, string, string | null, string, string, number, number, string, number];

interface LocationManifest {
    version: number;
    shards: Record<string, string>;
}

const LOCATION_LIBRARY_PATH = "/data/locations";
let manifestPromise: Promise<LocationManifest> | undefined;
const shardPromises = new Map<string, Promise<PlaceRecord[]>>();

function normaliseSearch(value: string): string {
    return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("en").trim();
}

function shardKeyFor(value: string): string {
    return Array.from(normaliseSearch(value)).slice(0, 2).join("");
}

async function loadManifest(): Promise<LocationManifest> {
    manifestPromise ??= fetch(`${LOCATION_LIBRARY_PATH}/manifest.json`, { cache: "no-cache" })
        .then(response => {
            if (!response.ok) throw new Error(`Location manifest failed: ${response.status}`);
            return response.json() as Promise<LocationManifest>;
        })
        .catch(error => {
            manifestPromise = undefined;
            throw error;
        });
    return manifestPromise;
}

async function loadShard(filename: string): Promise<PlaceRecord[]> {
    let promise = shardPromises.get(filename);
    if (!promise) {
        promise = fetch(`${LOCATION_LIBRARY_PATH}/shards/${filename}`, { cache: "force-cache" })
            .then(response => {
                if (!response.ok) throw new Error(`Location shard failed: ${response.status}`);
                return response.json() as Promise<PlaceRecord[]>;
            })
            .catch(error => {
                shardPromises.delete(filename);
                throw error;
            });
        shardPromises.set(filename, promise);
    }
    return promise;
}

export async function searchPlaces(
    query: string,
    signal?: AbortSignal
): Promise<PlaceSearchResult[]> {
    const value = normaliseSearch(query);

    if (value.length < 2) {
        return [];
    }

    signal?.throwIfAborted();
    const manifest = await loadManifest();
    const filename = manifest.shards[shardKeyFor(value)];
    if (!filename) return [];

    const records = await loadShard(filename);
    signal?.throwIfAborted();

    return records
        .filter(record => normaliseSearch(record[1]).startsWith(value) || normaliseSearch(record[2]).startsWith(value))
        .sort((left, right) => {
            const leftExact = normaliseSearch(left[1]) === value || normaliseSearch(left[2]) === value;
            const rightExact = normaliseSearch(right[1]) === value || normaliseSearch(right[2]) === value;
            return Number(rightExact) - Number(leftExact) || right[9] - left[9] || left[1].localeCompare(right[1]);
        })
        .slice(0, 10)
        .map(record => ({
            id: record[0],
            name: record[1],
            region: record[3],
            country: record[4],
            countryCode: record[5],
            latitude: record[6],
            longitude: record[7],
            timezone: record[8],
            population: record[9]
        }));
}
