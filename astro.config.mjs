import {defineConfig, envField} from "astro/config";
import preact from "@astrojs/preact";
import cloudflare from "@astrojs/cloudflare";

import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  site: "https://sonus.minceraft.dev/",
  output: "server",
  compressHTML: process.env.NODE_ENV === "production",
  trailingSlash: "ignore",
  integrations: [preact()],

  adapter: cloudflare({
      imageService: "compile",
  }),

  env: {
      schema: {
          WEBSOCKET_URL: envField.string({
              context: "client",
              access: "public",
              default: "wss://sonus.froglight.eu/api",
          }),
      },
  },

  vite: {
    plugins: [tailwindcss()],
  },
});