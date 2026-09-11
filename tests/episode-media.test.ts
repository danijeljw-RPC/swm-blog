import assert from "node:assert/strict";
import test from "node:test";

import { getEpisodeMedia } from "../src/utils/episode-media.ts";

const directories = {
  spotify: "https://open.spotify.com/show/example",
  applePodcasts: "https://podcasts.apple.com/show/example",
  amazonMusic: "",
  iheart: "https://www.iheart.com/podcast/example",
  pocketCasts: "",
};

test("text-only articles have no media presentation", () => {
  const media = getEpisodeMedia(
    { slug: "text-only", audio: null, video: { hosted: null, youtube: null, spotify: null } },
    directories,
  );

  assert.equal(media.hasMedia, false);
  assert.deepEqual(media.links, []);
});

test("media controls put external destinations before first-party actions and downloads", () => {
  const media = getEpisodeMedia(
    {
      slug: "episode-one",
      audio: { url: "https://media.sisterswithmirrors.com/audio/episode-one.mp3" },
      video: {
        hosted: "https://media.sisterswithmirrors.com/video/episode-one.mp4",
        youtube: "https://youtu.be/episode-one",
        spotify: "https://open.spotify.com/episode/episode-one",
      },
    },
    directories,
  );

  assert.equal(media.hasMedia, true);
  assert.deepEqual(media.links, [
    { id: "youtube", label: "Watch on YouTube", url: "https://youtu.be/episode-one" },
    { id: "spotify", label: "Watch on Spotify", url: "https://open.spotify.com/episode/episode-one" },
    { id: "applePodcasts", label: "Listen on Apple Podcasts", url: "https://podcasts.apple.com/show/example" },
    { id: "iheart", label: "Listen on iHeartRadio", url: "https://www.iheart.com/podcast/example" },
    { id: "hostedVideo", label: "Watch video", url: "/episodes/episode-one/watch/" },
    { id: "audio", label: "Listen to audio", url: "#episode-audio" },
    { id: "downloadAudio", label: "Download MP3", url: "/episodes/episode-one/download/audio/" },
    { id: "downloadVideo", label: "Download MP4", url: "/episodes/episode-one/download/video/" },
  ]);
});

test("audio articles expose the direct audio and configured podcast directories", () => {
  const media = getEpisodeMedia(
    {
      slug: "audio-only",
      audio: { url: "https://media.example/episode.mp3" },
      video: { hosted: null, youtube: null, spotify: null },
    },
    directories,
  );

  assert.equal(media.hasMedia, true);
  assert.deepEqual(media.links, [
    { id: "spotify", label: "Listen on Spotify", url: "https://open.spotify.com/show/example" },
    { id: "applePodcasts", label: "Listen on Apple Podcasts", url: "https://podcasts.apple.com/show/example" },
    { id: "iheart", label: "Listen on iHeartRadio", url: "https://www.iheart.com/podcast/example" },
    { id: "audio", label: "Listen to audio", url: "#episode-audio" },
    { id: "downloadAudio", label: "Download MP3", url: "/episodes/audio-only/download/audio/" },
  ]);
});
