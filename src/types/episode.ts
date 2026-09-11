import type { CollectionEntry } from "astro:content";

export type EpisodeEntry = CollectionEntry<"episodes">;
export type EpisodeData = EpisodeEntry["data"];
