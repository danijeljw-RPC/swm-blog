import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("admin submissions index reads only parsed filter and page values from the admin repository", async () => {
  const source = await readFile(new URL("../src/pages/admin/submissions/index.astro", import.meta.url), "utf8");

  assert.match(source, /D1AdminSubmissionRepository/);
  assert.match(source, /parseSubmissionFilter/);
  assert.match(source, /parsePage/);
  assert.match(source, /prerender\s*=\s*false/);
  assert.match(source, /Astro\.locals\.adminIdentity/);

  for (const label of ["All", "New", "Stories", "Questions", "Topic Suggestions", "Guest Requests", "Contacted", "Scheduled", "Used", "Archived"]) {
    assert.ok(source.includes(label), `expected filter label "${label}" in the index page`);
  }

  assert.match(source, /\/admin\/submissions\/\?filter=/);
});

test("admin submissions index renders the shared list component with required fields", async () => {
  const listSource = await readFile(new URL("../src/components/admin/SubmissionList.astro", import.meta.url), "utf8");

  for (const field of ["publicReference", "status", "excerpt", "displayIdentity", "createdAt"]) {
    assert.ok(listSource.includes(field), `expected SubmissionList to reference ${field}`);
  }
  assert.match(listSource, /<time[^>]*datetime/);
});

test("admin submissions index paginates with bounded previous/next links and a useful empty state", async () => {
  const source = await readFile(new URL("../src/pages/admin/submissions/index.astro", import.meta.url), "utf8");

  assert.match(source, /totalPages/);
  assert.match(source, /page\s*>\s*1/);
  assert.match(source, /page\s*<\s*.*totalPages/);
  assert.match(source, /No submissions/i);
});

test("submission detail route normalizes the reference and 404s on missing records", async () => {
  const source = await readFile(new URL("../src/pages/admin/submissions/[reference]/index.astro", import.meta.url), "utf8");

  assert.match(source, /normalizePublicReference/);
  assert.match(source, /findByReference/);
  assert.match(source, /Astro\.response\.status\s*=\s*404/);
  assert.match(source, /prerender\s*=\s*false/);
});

test("story detail renders identity, permissions, content, and status controls", async () => {
  const source = await readFile(new URL("../src/components/admin/SubmissionDetail.astro", import.meta.url), "utf8");

  for (const field of [
    "identityPreference",
    "publicationPermission",
    "contactPermission",
    "submissionType",
    "content",
  ]) {
    assert.ok(source.includes(field), `expected story field ${field}`);
  }

  for (const field of [
    "preferredName",
    "timezone",
    "about",
    "talkAbout",
    "whySwm",
    "website",
    "socialLinks",
    "previousAppearances",
    "topics",
    "anythingElse",
    "recordingAcknowledged",
  ]) {
    assert.ok(source.includes(field), `expected guest field ${field}`);
  }

  assert.match(source, /delivery/);
  assert.match(source, /createdAt/);
  assert.match(source, /updatedAt/);
  assert.match(source, /back|Back/);
  assert.match(source, /status/);
  assert.match(source, /<select[^>]*name="status"/);
  assert.doesNotMatch(source, /set:html/);
});
