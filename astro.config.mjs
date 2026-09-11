import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";

export default defineConfig({
  site: "https://sisterswithmirrors.com",
  output: "server",
  trailingSlash: "always",
  adapter: cloudflare({ imageService: "compile" }),
  vite: { build: { minify: false } },
});
