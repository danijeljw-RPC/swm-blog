import assert from "node:assert/strict";
import test from "node:test";

import { createEpisodeDownloadResponse } from "../src/utils/episode-download.ts";

test("episode download responses force an attachment with a stable filename", async () => {
  const response = await createEpisodeDownloadResponse(
    "episode-one",
    "audio",
    "https://media.example/episode-one.mp3",
    async () => new Response("audio bytes", {
      headers: { "Content-Type": "audio/mpeg", "Content-Length": "11" },
    }),
  );

  assert.equal(response.status, 200);
  assert.equal(response.headers.get("Content-Disposition"), 'attachment; filename="episode-one.mp3"');
  assert.equal(response.headers.get("Content-Type"), "audio/mpeg");
  assert.equal(response.headers.get("Content-Length"), "11");
  assert.equal(await response.text(), "audio bytes");
});

test("episode download responses reject unavailable media", async () => {
  const response = await createEpisodeDownloadResponse("episode-one", "video", null, async () => new Response());

  assert.equal(response.status, 404);
});
