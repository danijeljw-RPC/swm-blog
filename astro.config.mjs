import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { swissephEsmPlugin } from "./src/build/swisseph-esm-plugin";

export default defineConfig({
  site: "https://sisterswithmirrors.com",
  output: "server",
  trailingSlash: "always",
  adapter: cloudflare({ imageService: "compile", prerenderEnvironment: "node" }),
  vite: {
    plugins: [swissephEsmPlugin()],
    build: { minify: false },
  },
});
