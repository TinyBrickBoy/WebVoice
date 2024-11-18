import {defineConfig} from "astro/config";

import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
    site: "http://localhost:4321",
    output: "server",
    compressHTML: process.env.NODE_ENV === "production",
    trailingSlash: "ignore",
    integrations: [],
    adapter: node({
        mode: "standalone",
    }),
});