import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { validateContent } from "../scripts/lib/content-validation.mjs";

const validFrontmatter = (overrides = "") => `---
title: "Fixture episode"
slug: "fixture-episode"
episode: 1
publishedAt: 2026-09-10
draft: false
fixture: true
excerpt: "Fixture excerpt."
description: "Fixture description."
categories: [consciousness]
tags: [fixture]
heroImage: null
heroImageAlt: ""
duration: null
audio: null
video: { hosted: null, youtube: null, spotify: null }
podcast: { spotify: null, apple: null, amazon: null, iheart: null }
transcript: null
hosts: [dj, warren]
seo: { canonical: null, noindex: true }
${overrides}---

## In this episode

Fixture copy.
`;

async function makeRoot() {
  const root = await mkdtemp(path.join(os.tmpdir(), "swm-content-"));
  await mkdir(path.join(root, "src/content/episodes"), { recursive: true });
  await mkdir(path.join(root, "src/data"), { recursive: true });
  await mkdir(path.join(root, "src/config"), { recursive: true });
  await mkdir(path.join(root, "public/images/episodes"), { recursive: true });
  await writeFile(
    path.join(root, "src/config/categories.json"),
    JSON.stringify({ consciousness: "Consciousness", spirituality: "Spirituality" }),
  );
  await writeFile(
    path.join(root, "src/data/hosts.json"),
    JSON.stringify([
      { id: "dj", image: null },
      { id: "warren", image: null },
    ]),
  );
  return root;
}

test("valid content and JSON return no errors", async () => {
  const root = await makeRoot();
  await writeFile(path.join(root, "src/content/episodes/fixture.md"), validFrontmatter());
  const result = await validateContent(root);
  assert.deepEqual(result.errors, []);
  assert.equal(result.filesChecked, 3);
});

test("malformed YAML and missing required metadata are reported", async () => {
  const root = await makeRoot();
  await writeFile(
    path.join(root, "src/content/episodes/broken.md"),
    "---\ntitle: [broken\n---\n",
  );
  const result = await validateContent(root);
  assert.match(result.errors.join("\n"), /broken\.md: invalid frontmatter/);
});

test("duplicate slugs and episode numbers are reported together", async () => {
  const root = await makeRoot();
  await writeFile(path.join(root, "src/content/episodes/one.md"), validFrontmatter());
  await writeFile(path.join(root, "src/content/episodes/two.md"), validFrontmatter());
  const result = await validateContent(root);
  assert.match(result.errors.join("\n"), /duplicate slug "fixture-episode"/);
  assert.match(result.errors.join("\n"), /duplicate episode number 1/);
});

test("unknown categories and hosts are reported", async () => {
  const root = await makeRoot();
  const content = validFrontmatter()
    .replace("categories: [consciousness]", "categories: [unknown]")
    .replace("hosts: [dj, warren]", "hosts: [dj, stranger]");
  await writeFile(path.join(root, "src/content/episodes/unknown.md"), content);
  const result = await validateContent(root);
  assert.match(result.errors.join("\n"), /unknown category "unknown"/);
  assert.match(result.errors.join("\n"), /unknown host "stranger"/);
});

test("missing local episode and host assets are reported", async () => {
  const root = await makeRoot();
  const content = validFrontmatter()
    .replace("heroImage: null", 'heroImage: "/images/episodes/missing.svg"')
    .replace('heroImageAlt: ""', 'heroImageAlt: "Fixture art"');
  await writeFile(path.join(root, "src/content/episodes/missing.md"), content);
  await writeFile(
    path.join(root, "src/data/hosts.json"),
    JSON.stringify([{ id: "dj", image: "/images/hosts/missing.webp" }]),
  );
  const result = await validateContent(root);
  assert.match(result.errors.join("\n"), /missing local asset.*missing\.svg/);
  assert.match(result.errors.join("\n"), /missing local asset.*missing\.webp/);
});

test("malformed JSON is reported without aborting validation", async () => {
  const root = await makeRoot();
  await writeFile(path.join(root, "src/content/episodes/fixture.md"), validFrontmatter());
  await writeFile(path.join(root, "src/data/broken.json"), "{not-json");
  const result = await validateContent(root);
  assert.match(result.errors.join("\n"), /broken\.json: invalid JSON/);
});

test("incomplete audio enclosure metadata is reported", async () => {
  const root = await makeRoot();
  const content = validFrontmatter().replace(
    "audio: null",
    'audio: { url: "https://media.example/episode.mp3", mimeType: "audio/mpeg", bytes: 0 }',
  );
  await writeFile(path.join(root, "src/content/episodes/audio.md"), content);
  const result = await validateContent(root);
  assert.match(result.errors.join("\n"), /audio\.bytes must be a positive integer/);
});

test("the repository includes at least one valid episode fixture", async () => {
  const result = await validateContent(process.cwd());
  assert.deepEqual(result.errors, []);
  assert.ok(result.filesChecked >= 3, "expected category, host, and episode files");
});

test("source-data notes beside episodes are not treated as publishable content", async () => {
  const root = await makeRoot();
  await writeFile(path.join(root, "src/content/episodes/episode-source-data.md"), "raw editorial notes");
  await writeFile(path.join(root, "src/content/episodes/fixture.md"), validFrontmatter());

  const result = await validateContent(root);
  assert.deepEqual(result.errors, []);
});
