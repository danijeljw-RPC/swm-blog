import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("homepage daily tarot tile shows the selected card image and links to its full reading", async () => {
  const homepage = await readFile(
    new URL("../src/pages/index.astro", import.meta.url),
    "utf8",
  );

  assert.match(
    homepage,
    /<a class="mirror-tile mirror-tile--tarot" href="\/daily-mirror\/">[\s\S]*?<img[^>]+src={`\/images\/tarot\/\$\{tarotCard\.image\}`}[^>]+alt={`\$\{tarotCard\.name\} tarot card`}/,
  );
  assert.match(homepage, /\.mirror-tile--tarot img \{[^}]*height: 5\.5rem;/s);
});
