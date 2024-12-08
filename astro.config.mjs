import {defineConfig} from "astro/config";
import node from "@astrojs/node";
import preact from "@astrojs/preact";

// https://astro.build/config
export default defineConfig({
    site: "http://localhost:4321",
    output: "server",
    compressHTML: process.env.NODE_ENV === "production",
    trailingSlash: "ignore",
    integrations: [preact()],
    adapter: node({
        mode: "standalone",
    }),
});
