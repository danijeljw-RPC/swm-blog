import { podcast } from "./podcast";

export const platforms = {
  rss: { label: "RSS", url: "/rss.xml" },
  blogRss: { label: "Blog RSS", url: "/blog.xml" },
  spotify: { label: "Spotify", url: podcast.platforms.spotify },
  applePodcasts: { label: "Apple Podcasts", url: podcast.platforms.applePodcasts },
  youtube: { label: "YouTube", url: podcast.platforms.youtube },
  youtubeMusic: { label: "YouTube Music", url: "" },
  amazonMusic: { label: "Amazon Music / Audible", url: podcast.platforms.amazonMusic },
  iheart: { label: "iHeartRadio", url: podcast.platforms.iheart },
  pocketCasts: { label: "Pocket Casts", url: podcast.platforms.pocketCasts },
  castbox: { label: "Castbox", url: "" },
  podcastAddict: { label: "Podcast Addict", url: "" },
  overcast: { label: "Overcast", url: "" },
  goodpods: { label: "Goodpods", url: "" }
} as const;
