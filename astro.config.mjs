import {defineConfig, envField} from "astro/config";
import preact from "@astrojs/preact";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";

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
            SKIN_ENDPOINT: envField.string({
                context: "server",
                access: "public",
                // I would rather use crafthead.net, but they have some weird SSL things going on;
                // the default NodeJS runtime doesn't recognize Cloudflare-Signed SSL Certificates
                default: "https://cravatar.eu/helmavatar/%s/8.png",
            }),
        },
    },

    vite: {
        plugins: [
            tailwindcss(),
            Icons({compiler: "jsx", jsx: "preact"}),
        ],
    },
});
