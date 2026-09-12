import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { buildLocationLibrary } from "../scripts/lib/build-location-library.mjs";
import { searchPlaces } from "../src/lib/astrology/location/search.ts";

const cities = [
  ["2078025", "Adelaide", "Adelaide", "Adelaide,Adelaida", "-34.9287", "138.5986", "P", "PPLA", "AU", "", "05", "", "", "", "1387290", "", "", "Australia/Adelaide"],
  ["2950159", "Berlin", "Berlin", "Berlim", "52.5244", "13.4105", "P", "PPLC", "DE", "", "16", "", "", "", "3426354", "", "", "Europe/Berlin"],
  ["1816670", "北京", "Beijing", "Peking", "39.9075", "116.3972", "P", "PPLC", "CN", "", "22", "", "", "", "11716620", "", "", "Asia/Shanghai"]
].map(fields => fields.join("\t")).join("\n");

test("builds validated, content-addressed location shards from GeoNames files", async () => {
  const root = await mkdtemp(join(tmpdir(), "swm-location-library-"));
  const output = join(root, "output");

  try {
    await writeFile(join(root, "cities500.txt"), `${cities}\n`);
    await writeFile(join(root, "admin1CodesASCII.txt"), "AU.05\tSouth Australia\tSouth Australia\t2061327\nDE.16\tBerlin\tBerlin\t2950157\nCN.22\tBeijing\tBeijing\t2038349\n");
    await writeFile(join(root, "countryInfo.txt"), "AU\tAUS\t036\tAS\tAustralia\nDE\tDEU\t276\tGM\tGermany\nCN\tCHN\t156\tCH\tChina\n");

    const summary = await buildLocationLibrary({
      citiesPath: join(root, "cities500.txt"),
      adminsPath: join(root, "admin1CodesASCII.txt"),
      countriesPath: join(root, "countryInfo.txt"),
      outputDirectory: output,
      minimumRows: 3,
      generatedAt: "2026-09-13T00:00:00.000Z"
    });

    assert.equal(summary.rows, 3);
    assert.equal(summary.shards, 3);

    const manifest = JSON.parse(await readFile(join(output, "manifest.json"), "utf8"));
    assert.equal(manifest.rows, 3);
    assert.equal(manifest.generatedAt, "2026-09-13T00:00:00.000Z");
    assert.match(manifest.shards.ad, /^ad\.[a-f0-9]{12}\.json$/);
    assert.match(manifest.shards.be, /^be\.[a-f0-9]{12}\.json$/);
    assert.match(manifest.shards["北京"], /^u5317-u4eac\.[a-f0-9]{12}\.json$/);

    const shard = JSON.parse(await readFile(join(output, "shards", manifest.shards.ad), "utf8"));
    assert.deepEqual(shard, [[2078025, "Adelaide", "Adelaide", "South Australia", "Australia", "AU", -34.9287, 138.5986, "Australia/Adelaide", 1387290]]);

    const files = await readdir(join(output, "shards"));
    assert.equal(files.length, 3);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("searches a static shard and ranks exact and populous matches", async () => {
  const originalFetch = globalThis.fetch;
  const requests: string[] = [];
  globalThis.fetch = async (input) => {
    const url = String(input);
    requests.push(url);
    if (url.endsWith("manifest.json")) {
      return Response.json({ version: 1, shards: { ad: "ad.123456789abc.json" } });
    }
    return Response.json([
      [2, "Adelaide River", "Adelaide River", "Northern Territory", "Australia", "AU", -13.24, 131.1, "Australia/Darwin", 353],
      [1, "Adelaide", "Adelaide", "South Australia", "Australia", "AU", -34.93, 138.6, "Australia/Adelaide", 1387290]
    ]);
  };

  try {
    const results = await searchPlaces("Adelaide");
    assert.deepEqual(results.map(place => place.name), ["Adelaide", "Adelaide River"]);
    assert.deepEqual(requests, [
      "/data/locations/manifest.json",
      "/data/locations/shards/ad.123456789abc.json"
    ]);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
