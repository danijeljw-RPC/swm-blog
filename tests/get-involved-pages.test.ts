import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
const root = new URL("../", import.meta.url); const read = (path: string) => readFile(new URL(path, root), "utf8");

test("Get Involved keeps story and guest as separate workflows", async () => {
  const landing = await read("src/pages/get-involved/index.astro");
  assert.match(landing, /\/get-involved\/share-your-story\//); assert.match(landing, /\/get-involved\/be-a-guest\//);
  assert.match(landing, /doesn’t mean you’re asking to appear/); assert.match(landing, /don’t need formal qualifications/);
});

test("story form includes identity, permission, privacy, and cross-link controls", async () => {
  const page = await read("src/pages/get-involved/share-your-story.astro");
  for (const value of ["story","question","topic","other","name","pseudonym","anonymous","read","paraphrase","private"]) assert.match(page, new RegExp(`value="${value}"`));
  assert.match(page, /20,000 characters/); assert.match(page, /won’t be able to respond personally/); assert.match(page, /\/get-involved\/be-a-guest\//);
});

test("guest form keeps optional profile signals optional and requires recording acknowledgement", async () => {
  const page = await read("src/pages/get-involved/be-a-guest.astro");
  assert.match(page, /name="recordingAcknowledged" required/); assert.match(page, /isn’t the final recording or release agreement/);
  assert.match(page, /No previous appearances are expected/); assert.match(page, /not a checklist you need to pass/); assert.match(page, /\/get-involved\/share-your-story\//);
});

test("navigation and sitemap discover all Get Involved routes", async () => {
  const header = await read("src/components/layout/Header.astro"); const footer = await read("src/components/layout/Footer.astro"); const sitemap = await read("src/pages/sitemaps/pages.xml.ts");
  assert.match(header, /\["Get Involved", "\/get-involved\/"\]/); assert.match(footer, /Share Your Story/); assert.match(footer, /Be a Guest/);
  assert.match(sitemap, /\/get-involved\/share-your-story\//); assert.match(sitemap, /\/get-involved\/be-a-guest\//);
});
