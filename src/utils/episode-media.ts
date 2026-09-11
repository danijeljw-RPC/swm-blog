export type MediaPlatformId =
  | "audio"
  | "downloadAudio"
  | "downloadVideo"
  | "hostedVideo"
  | "youtube"
  | "spotify"
  | "applePodcasts"
  | "amazonMusic"
  | "iheart"
  | "pocketCasts";

export interface MediaLink {
  id: MediaPlatformId;
  label: string;
  url: string;
}

interface EpisodeMediaInput {
  slug: string;
  audio?: { url: string } | null;
  video?: {
    hosted?: string | null;
    youtube?: string | null;
    spotify?: string | null;
  };
}

interface PodcastDirectories {
  spotify?: string;
  applePodcasts?: string;
  amazonMusic?: string;
  iheart?: string;
  pocketCasts?: string;
}

const compact = (links: Array<MediaLink | null>): MediaLink[] => links.filter((link): link is MediaLink => Boolean(link));

export function getEpisodeMedia(episode: EpisodeMediaInput, directories: PodcastDirectories) {
  const links = compact([
    episode.video?.youtube ? { id: "youtube", label: "Watch on YouTube", url: episode.video.youtube } : null,
    episode.video?.spotify ? { id: "spotify", label: "Watch on Spotify", url: episode.video.spotify } : null,
    episode.audio && !episode.video?.spotify && directories.spotify ? { id: "spotify", label: "Listen on Spotify", url: directories.spotify } : null,
    episode.audio && directories.applePodcasts ? { id: "applePodcasts", label: "Listen on Apple Podcasts", url: directories.applePodcasts } : null,
    episode.audio && directories.amazonMusic ? { id: "amazonMusic", label: "Listen on Amazon Music", url: directories.amazonMusic } : null,
    episode.audio && directories.iheart ? { id: "iheart", label: "Listen on iHeartRadio", url: directories.iheart } : null,
    episode.audio && directories.pocketCasts ? { id: "pocketCasts", label: "Listen on Pocket Casts", url: directories.pocketCasts } : null,
    episode.video?.hosted ? { id: "hostedVideo", label: "Watch video", url: `/episodes/${episode.slug}/watch/` } : null,
    episode.audio ? { id: "audio", label: "Listen to audio", url: "#episode-audio" } : null,
    episode.audio ? { id: "downloadAudio", label: "Download MP3", url: `/episodes/${episode.slug}/download/audio/` } : null,
    episode.video?.hosted ? { id: "downloadVideo", label: "Download MP4", url: `/episodes/${episode.slug}/download/video/` } : null,
  ]);

  return { hasMedia: links.length > 0, links };
}
