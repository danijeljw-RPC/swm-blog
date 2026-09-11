import assert from "node:assert/strict";
import {
  chmod,
  copyFile,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  symlink,
  writeFile,
} from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import sharp from "sharp";

const sourceScript = path.resolve("scripts/generate-episode-artwork.sh");
const sourceNodeModules = path.resolve("node_modules");

async function createFixture(t) {
  const root = await mkdtemp(path.join(tmpdir(), "swm-artwork-"));
  const scriptDirectory = path.join(root, "scripts");
  const outputDirectory = path.join(root, "public", "images", "episodes");
  const script = path.join(scriptDirectory, "generate-episode-artwork.sh");

  await mkdir(scriptDirectory, { recursive: true });
  await mkdir(outputDirectory, { recursive: true });
  await copyFile(sourceScript, script);
  await chmod(script, 0o755);
  await symlink(sourceNodeModules, path.join(root, "node_modules"), "dir");
  t.after(() => rm(root, { recursive: true, force: true }));

  return { outputDirectory, root, script };
}

test("generates one themed SVG using the title and subtitle filename", async (t) => {
  const fixture = await createFixture(t);
  const result = spawnSync(
    fixture.script,
    ["LOOK INTO THE MIRROR", "FIXTURE ARTWORK - NOT A RELEASED EPISODE", "--seed", "17"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  const filename =
    "look-into-the-mirror-fixture-artwork-not-a-released-episode.svg";
  const svg = await readFile(path.join(fixture.outputDirectory, filename), "utf8");

  assert.match(svg, /viewBox="0 0 1600 900"/);
  assert.match(svg, /#A98853/);
  assert.match(svg, /#593057/);
  assert.match(svg, />LOOK INTO THE MIRROR<\/text>/);
  assert.match(svg, />FIXTURE ARTWORK - NOT A RELEASED EPISODE<\/text>/);

  const png = path.join(
    fixture.outputDirectory,
    "look-into-the-mirror-fixture-artwork-not-a-released-episode.png",
  );
  const metadata = await sharp(png).metadata();
  assert.equal(metadata.format, "png");
  assert.equal(metadata.width, 1600);
  assert.equal(metadata.height, 900);
});

test("seeds zero through forty-nine select all fifty artwork variants", async (t) => {
  const fixture = await createFixture(t);
  const variants = new Set();

  for (let seed = 0; seed < 50; seed += 1) {
    const result = spawnSync(
      fixture.script,
      ["Variant Study", "Seed Catalogue", "--seed", String(seed), "--force"],
      { encoding: "utf8" },
    );
    assert.equal(result.status, 0, result.stderr);

    const svg = await readFile(
      path.join(fixture.outputDirectory, "variant-study-seed-catalogue.svg"),
      "utf8",
    );
    const match = svg.match(/data-variant="(\d+)"/);
    assert.ok(match, `seed ${seed} did not identify its variant`);
    variants.add(Number(match[1]));
  }

  assert.deepEqual([...variants].sort((a, b) => a - b),
    Array.from({ length: 50 }, (_, index) => index + 1));
});

test("rejects titles or subtitles that cannot form a filename", async (t) => {
  const fixture = await createFixture(t);
  const emptyTitle = spawnSync(fixture.script, ["", "A subtitle"], { encoding: "utf8" });
  const punctuationOnly = spawnSync(fixture.script, ["!!!", "???"], { encoding: "utf8" });

  assert.notEqual(emptyTitle.status, 0);
  assert.match(emptyTitle.stderr, /title and subtitle must not be empty/i);
  assert.notEqual(punctuationOnly.status, 0);
  assert.match(punctuationOnly.stderr, /filename/i);
});

test("escapes episode text and protects existing artwork from replacement", async (t) => {
  const fixture = await createFixture(t);
  const args = ["Mirrors & Mysteries", `The <Veil> "Opens"`, "--seed", "23"];
  const first = spawnSync(fixture.script, args, { encoding: "utf8" });

  assert.equal(first.status, 0, first.stderr);
  const output = path.join(
    fixture.outputDirectory,
    "mirrors-mysteries-the-veil-opens.svg",
  );
  const initialSvg = await readFile(output, "utf8");
  assert.match(initialSvg, /Mirrors &amp; Mysteries/);
  assert.match(initialSvg, /The &lt;Veil&gt; &quot;Opens&quot;/);

  const collision = spawnSync(fixture.script, args, { encoding: "utf8" });
  assert.equal(collision.status, 73);
  assert.match(collision.stderr, /already exists/);

  const forced = spawnSync(fixture.script, [...args, "--force"], { encoding: "utf8" });
  assert.equal(forced.status, 0, forced.stderr);
  assert.equal(await readFile(output, "utf8"), initialSvg);
});

test("fits long headings into the artwork text area", async (t) => {
  const fixture = await createFixture(t);
  const longTitle = "WHEN THE MIRROR BETWEEN ALL POSSIBLE WORLDS BEGINS TO SPEAK";
  const result = spawnSync(
    fixture.script,
    [longTitle, "A JOURNEY THROUGH CONSCIOUSNESS", "--seed", "31"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  const svg = await readFile(
    path.join(
      fixture.outputDirectory,
      "when-the-mirror-between-all-possible-worlds-begins-to-speak-a-journey-through-consciousness.svg",
    ),
    "utf8",
  );
  const titleElement = svg.match(/<text[^>]+data-role="heading"[^>]*>/)?.[0];
  assert.ok(titleElement, "heading text element is not identified");
  assert.match(titleElement, /font-size="(?:2[8-9]|3\d|4\d|5[0-8])"/);
});

test("removes punctuation instead of turning it into filename separators", async (t) => {
  const fixture = await createFixture(t);
  const result = spawnSync(
    fixture.script,
    ["Mirror's Call", "Who Are You?", "--seed", "9"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 0, result.stderr);
  const svg = await readFile(
    path.join(fixture.outputDirectory, "mirrors-call-who-are-you.svg"),
    "utf8",
  );
  assert.match(svg, /Mirror&apos;s Call/);
});

test("an existing PNG blocks generation unless force is supplied", async (t) => {
  const fixture = await createFixture(t);
  const png = path.join(fixture.outputDirectory, "protected-artwork-episode-one.png");
  const svg = path.join(fixture.outputDirectory, "protected-artwork-episode-one.svg");
  await writeFile(png, "keep me", "utf8");

  const result = spawnSync(
    fixture.script,
    ["Protected Artwork", "Episode One", "--seed", "12"],
    { encoding: "utf8" },
  );

  assert.equal(result.status, 73);
  assert.match(result.stderr, /already exists/);
  assert.equal(await readFile(png, "utf8"), "keep me");
  await assert.rejects(readFile(svg), { code: "ENOENT" });
});

test("a PNG rendering failure does not leave partial artwork", async (t) => {
  const fixture = await createFixture(t);
  await rm(path.join(fixture.root, "node_modules"));

  const result = spawnSync(
    fixture.script,
    ["Atomic Artwork", "Renderer Failure", "--seed", "5"],
    { encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  await assert.rejects(
    readFile(path.join(fixture.outputDirectory, "atomic-artwork-renderer-failure.svg")),
    { code: "ENOENT" },
  );
  await assert.rejects(
    readFile(path.join(fixture.outputDirectory, "atomic-artwork-renderer-failure.png")),
    { code: "ENOENT" },
  );
});
