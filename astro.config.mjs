import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import { swissephEsmPlugin } from "./src/build/swisseph-esm-plugin";

const site = process.env.CLOUDFLARE_ENV === "dev"
  ? "https://dev.sisterswithmirrors.com"
  : process.env.CLOUDFLARE_ENV === "prod"
    ? "https://sisterswithmirrors.com"
    : "http://localhost:4321";

export default defineConfig({
  site,
  output: "server",
  trailingSlash: "always",
  adapter: cloudflare({ imageService: "compile", prerenderEnvironment: "node" }),
  vite: {
    plugins: [swissephEsmPlugin()],
    build: { minify: false },
  },
});
