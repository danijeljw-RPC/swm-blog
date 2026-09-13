import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { parse } from "yaml";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

async function listFiles(directory, extensionPattern) {
  try {
    const entries = await readdir(directory, { withFileTypes: true });
    const nested = await Promise.all(
      entries.map((entry) => {
        const target = path.join(directory, entry.name);
        return entry.isDirectory()
          ? listFiles(target, extensionPattern)
          : extensionPattern.test(entry.name)
            ? [target]
            : [];
      }),
    );
    return nested.flat();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

function relative(root, file) {
  return path.relative(root, file).split(path.sep).join("/");
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error("frontmatter delimiters are missing");
  const value = parse(match[1]);
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("frontmatter must be an object");
  }
  return value;
}

async function assetExists(root, asset) {
  if (typeof asset !== "string" || !asset.startsWith("/") || asset.startsWith("//")) {
    return true;
  }
  const publicRoot = path.resolve(root, "public");
  const target = path.resolve(publicRoot, `.${asset}`);
  if (target !== publicRoot && !target.startsWith(`${publicRoot}${path.sep}`)) return false;
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

function validateEpisodeShape(file, data, categories, hostIds, errors) {
  const requiredStrings = ["title", "slug", "excerpt", "description"];
  for (const field of requiredStrings) {
    if (typeof data[field] !== "string" || data[field].trim() === "") {
      errors.push(`${file}: missing required metadata "${field}"`);
    }
  }
  if (typeof data.slug === "string" && !slugPattern.test(data.slug)) {
    errors.push(`${file}: slug must contain lowercase letters, numbers, and hyphens only`);
  }
  if (!Number.isInteger(data.episode) || data.episode < 1) {
    errors.push(`${file}: episode must be a positive integer`);
  }
  if (!(typeof data.publishedAt === "string" || data.publishedAt instanceof Date)) {
    errors.push(`${file}: publishedAt is required`);
  }
  if (typeof data.draft !== "boolean") errors.push(`${file}: draft must be boolean`);
  if (!Array.isArray(data.categories) || data.categories.length === 0) {
    errors.push(`${file}: at least one category is required`);
  } else {
    for (const category of data.categories) {
      if (!categories.has(category)) errors.push(`${file}: unknown category "${category}"`);
    }
  }
  if (!Array.isArray(data.hosts) || data.hosts.length === 0) {
    errors.push(`${file}: at least one host is required`);
  } else {
    for (const host of data.hosts) {
      if (!hostIds.has(host)) errors.push(`${file}: unknown host "${host}"`);
    }
  }
  if (data.heroImage && !String(data.heroImageAlt ?? "").trim()) {
    errors.push(`${file}: heroImageAlt is required when heroImage is set`);
  }
  if (data.audio != null) {
    if (typeof data.audio !== "object") {
      errors.push(`${file}: audio must be null or an enclosure object`);
    } else {
      if (!/^https?:\/\//.test(data.audio.url ?? "")) errors.push(`${file}: audio.url must be an absolute URL`);
      if (!/^audio\//.test(data.audio.mimeType ?? "")) errors.push(`${file}: audio.mimeType must be an audio MIME type`);
      if (!Number.isInteger(data.audio.bytes) || data.audio.bytes < 1) errors.push(`${file}: audio.bytes must be a positive integer`);
    }
  }
}

export async function validateContent(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const errors = [];
  let filesChecked = 0;

  let categoryData = {};
  const categoryFile = path.join(root, "src/config/categories.json");
  try {
    categoryData = JSON.parse(await readFile(categoryFile, "utf8"));
    filesChecked += 1;
  } catch (error) {
    errors.push(`${relative(root, categoryFile)}: invalid JSON (${error.message})`);
  }
  const categories = new Set(Object.keys(categoryData));

  const dataFiles = await listFiles(path.join(root, "src/data"), /\.json$/);
  let hosts = [];
  for (const file of dataFiles) {
    try {
      const value = JSON.parse(await readFile(file, "utf8"));
      filesChecked += 1;
      if (file === path.join(root, "src/data/hosts.json")) hosts = value;
    } catch (error) {
      filesChecked += 1;
      errors.push(`${relative(root, file)}: invalid JSON (${error.message})`);
    }
  }
  const hostIds = new Set(Array.isArray(hosts) ? hosts.map((host) => host.id) : []);

  if (Array.isArray(hosts)) {
    for (const host of hosts) {
      if (host?.image && !(await assetExists(root, host.image))) {
        errors.push(`src/data/hosts.json: missing local asset "${host.image}"`);
      }
    }
  }

  const seenSlugs = new Map();
  const seenEpisodes = new Map();
  const episodeFiles = (await listFiles(path.join(root, "src/content/episodes"), /\.mdx?$/)).filter(
    (file) => !/-source-data\.mdx?$/.test(path.basename(file)),
  );
  for (const absoluteFile of episodeFiles) {
    const file = relative(root, absoluteFile);
    filesChecked += 1;
    let data;
    try {
      data = parseFrontmatter(await readFile(absoluteFile, "utf8"));
    } catch (error) {
      errors.push(`${file}: invalid frontmatter (${error.message})`);
      continue;
    }

    validateEpisodeShape(file, data, categories, hostIds, errors);
    if (typeof data.slug === "string") {
      if (seenSlugs.has(data.slug)) errors.push(`${file}: duplicate slug "${data.slug}" (also in ${seenSlugs.get(data.slug)})`);
      else seenSlugs.set(data.slug, file);
    }
    if (Number.isInteger(data.episode)) {
      if (seenEpisodes.has(data.episode)) errors.push(`${file}: duplicate episode number ${data.episode} (also in ${seenEpisodes.get(data.episode)})`);
      else seenEpisodes.set(data.episode, file);
    }
    if (data.heroImage && !(await assetExists(root, data.heroImage))) {
      errors.push(`${file}: missing local asset "${data.heroImage}"`);
    }
  }

  return { errors, filesChecked };
}
