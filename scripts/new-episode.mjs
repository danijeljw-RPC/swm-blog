import { access, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import {
  buildEpisodeFilename,
  getCategoryKeys,
  parseCategories,
  renderEpisodeMarkdown,
  slugify,
} from "./lib/episode-authoring.mjs";

const episodeDirectory = path.resolve("src/content/episodes");
const prompt = createInterface({ input, output });

async function askRequired(label) {
  const value = (await prompt.question(`${label}: `)).trim();
  if (!value) throw new Error(`${label} is required.`);
  return value;
}

try {
  const categoryKeys = getCategoryKeys();
  output.write(`Category keys: ${categoryKeys.join(", ")}\n`);

  const episode = Number.parseInt(await askRequired("Episode number"), 10);
  if (!Number.isInteger(episode) || episode < 1) {
    throw new Error("Episode number must be a positive integer.");
  }
  const season = Number.parseInt((await prompt.question("Season number (default 1): ")).trim() || "1", 10);
  if (!Number.isInteger(season) || season < 1) {
    throw new Error("Season number must be a positive integer.");
  }
  const title = await askRequired("Title");
  const publishedAt = await askRequired("Publication date (YYYY-MM-DD)");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(publishedAt)) {
    throw new Error("Publication date must use YYYY-MM-DD.");
  }
  const description = await askRequired("Short description");
  const categories = parseCategories(await askRequired("Categories (comma separated)"));
  const audioUrl = (await prompt.question("R2 audio URL (optional): ")).trim();
  const audioBytes = audioUrl
    ? Number.parseInt(await askRequired("Audio byte length"), 10)
    : undefined;
  if (audioUrl && (!Number.isInteger(audioBytes) || audioBytes < 1)) {
    throw new Error("Audio byte length must be a positive integer.");
  }
  const youtubeUrl = (await prompt.question("YouTube URL (optional): ")).trim();
  const spotifyUrl = (await prompt.question("Spotify URL (optional): ")).trim();
  const hostedVideoUrl = (await prompt.question("R2 video URL (optional): ")).trim();
  const heroImage = (await prompt.question("Hero image path (optional): ")).trim();
  const heroImageAlt = heroImage ? await askRequired("Hero image alt text") : "";

  const filename = buildEpisodeFilename({ episode, publishedAt, title });
  const destination = path.join(episodeDirectory, filename);
  await mkdir(episodeDirectory, { recursive: true });
  try {
    await access(destination);
    throw new Error(`Episode file already exists: ${destination}`);
  } catch (error) {
    if (error?.code !== "ENOENT") throw error;
  }

  const wantedSlug = slugify(title);
  for (const file of await readdir(episodeDirectory)) {
    if (!file.endsWith(".md") && !file.endsWith(".mdx")) continue;
    const existing = await readFile(path.join(episodeDirectory, file), "utf8");
    if (new RegExp(`^slug:\\s*["']?${wantedSlug}["']?\\s*$`, "m").test(existing)) {
      throw new Error(`Episode slug already exists in ${file}: ${wantedSlug}`);
    }
  }

  await writeFile(
    destination,
    renderEpisodeMarkdown({
      episode,
      season,
      title,
      publishedAt,
      description,
      categories,
      audioUrl,
      audioBytes,
      youtubeUrl,
      spotifyUrl,
      hostedVideoUrl,
      heroImage,
      heroImageAlt,
    }),
    { encoding: "utf8", flag: "wx" },
  );
  output.write(`Created ${destination}\n`);
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  prompt.close();
}
