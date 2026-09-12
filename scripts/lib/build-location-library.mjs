import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { basename, join } from "node:path";
import { pathToFileURL } from "node:url";

const SOURCE_URL = "https://download.geonames.org/export/dump/cities500.zip";
const LICENSE_URL = "https://creativecommons.org/licenses/by/4.0/";

export function normalisePlaceSearch(value) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase("en").trim();
}

export function shardKeyFor(value) {
  return Array.from(normalisePlaceSearch(value)).slice(0, 2).join("");
}

function safeShardName(key) {
  if (/^[a-z0-9]+$/u.test(key)) return key;
  return Array.from(key).map(character => {
    return /^[a-z0-9]$/u.test(character)
      ? character
      : `u${character.codePointAt(0).toString(16)}`;
  }).join("-");
}

function parseLookupFile(text, pick) {
  const values = new Map();
  for (const line of text.split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const fields = line.split("\t");
    const entry = pick(fields);
    if (entry) values.set(entry[0], entry[1]);
  }
  return values;
}

export async function buildLocationLibrary({
  citiesPath,
  adminsPath,
  countriesPath,
  outputDirectory,
  minimumRows = 200_000,
  generatedAt = new Date().toISOString()
}) {
  const [citiesText, adminsText, countriesText] = await Promise.all([
    readFile(citiesPath, "utf8"),
    readFile(adminsPath, "utf8"),
    readFile(countriesPath, "utf8")
  ]);

  const countries = parseLookupFile(countriesText, fields => {
    return fields.length >= 5 ? [fields[0], fields[4]] : null;
  });
  const admins = parseLookupFile(adminsText, fields => {
    return fields.length >= 2 ? [fields[0], fields[1]] : null;
  });
  const shards = new Map();
  let rows = 0;
  let foundAdelaide = false;

  for (const line of citiesText.split("\n")) {
    if (!line) continue;
    const fields = line.split("\t");
    if (fields.length < 18) {
      throw new Error(`Malformed GeoNames row ${rows + 1}`);
    }

    const [id, name, asciiName] = fields;
    const countryCode = fields[8];
    const timezone = fields[17];
    const record = [
      Number(id),
      name,
      asciiName,
      admins.get(`${countryCode}.${fields[10]}`) ?? null,
      countries.get(countryCode) ?? countryCode,
      countryCode,
      Number(fields[4]),
      Number(fields[5]),
      timezone,
      Number(fields[14] || 0)
    ];

    if (!Number.isInteger(record[0]) || !Number.isFinite(record[6]) || !Number.isFinite(record[7])) {
      throw new Error(`Invalid numeric value in GeoNames row ${rows + 1}`);
    }

    const keys = new Set([shardKeyFor(name), shardKeyFor(asciiName)]);
    for (const key of keys) {
      if (!key) continue;
      const records = shards.get(key) ?? [];
      records.push(record);
      shards.set(key, records);
    }

    if (asciiName === "Adelaide" && countryCode === "AU" && timezone === "Australia/Adelaide") {
      foundAdelaide = true;
    }
    rows += 1;
  }

  if (rows < minimumRows) {
    throw new Error(`GeoNames row count is suspiciously low: ${rows} (minimum ${minimumRows})`);
  }
  if (!foundAdelaide) {
    throw new Error("Adelaide sanity check failed");
  }

  await rm(outputDirectory, { recursive: true, force: true });
  const shardsDirectory = join(outputDirectory, "shards");
  await mkdir(shardsDirectory, { recursive: true });

  const manifestShards = {};
  let largestShardBytes = 0;
  for (const key of [...shards.keys()].sort()) {
    const records = shards.get(key);
    records.sort((left, right) => right[9] - left[9] || left[1].localeCompare(right[1]));
    const json = `${JSON.stringify(records)}\n`;
    const hash = createHash("sha256").update(json).digest("hex").slice(0, 12);
    const filename = `${safeShardName(key)}.${hash}.json`;
    await writeFile(join(shardsDirectory, filename), json);
    manifestShards[key] = filename;
    largestShardBytes = Math.max(largestShardBytes, Buffer.byteLength(json));
  }

  const manifest = {
    version: 1,
    generatedAt,
    source: SOURCE_URL,
    license: LICENSE_URL,
    rows,
    shards: manifestShards
  };
  await writeFile(join(outputDirectory, "manifest.json"), `${JSON.stringify(manifest)}\n`);
  await writeFile(join(outputDirectory, "NOTICE.txt"), "Location data is derived from GeoNames (https://www.geonames.org/) and is licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).\n");

  return { rows, shards: shards.size, largestShardBytes };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [citiesPath, adminsPath, countriesPath, outputDirectory] = process.argv.slice(2);
  if (!citiesPath || !adminsPath || !countriesPath || !outputDirectory) {
    console.error(`Usage: node ${basename(process.argv[1])} <cities> <admins> <countries> <output>`);
    process.exit(2);
  }
  const summary = await buildLocationLibrary({ citiesPath, adminsPath, countriesPath, outputDirectory });
  console.log(`Generated ${summary.rows} places in ${summary.shards} shards; largest shard ${summary.largestShardBytes} bytes.`);
}
