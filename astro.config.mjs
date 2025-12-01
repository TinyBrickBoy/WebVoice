import {defineConfig} from "astro/config";
import preact from "@astrojs/preact";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
    site: "https://sonus.minceraft.dev/",
    output: "server",
    compressHTML: process.env.NODE_ENV === "production",
    trailingSlash: "ignore",
    integrations: [preact()],
    adapter: cloudflare(),
});
