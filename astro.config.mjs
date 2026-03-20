import {defineConfig, envField} from "astro/config";
import preact from "@astrojs/preact";
import cloudflare from "@astrojs/cloudflare";
import node from "@astrojs/node";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import {execSync} from "node:child_process";

const GIT_COMMIT_HASH = (import.meta.env.GITHUB_SHA || "").trim().slice(0, 7) || execSync("git rev-parse --short HEAD").toString().trim();

// https://astro.build/config
export default defineConfig({
    site: import.meta.env.ASTRO_SITE ?? "https://sonus.minceraft.dev/",
    output: "server",
    compressHTML: import.meta.env.NODE_ENV === "production",
    trailingSlash: "ignore",
    integrations: [preact()],

    adapter: process.env.DOCKER ? node({
        mode: "standalone"
    }) : cloudflare({
        imageService: "compile",
    }),

    env: {
        schema: {
            DESIGNER_MODE: envField.boolean({
                context: "server",
                access: "public",
                default: false,
            }),
            DEFAULT_WEBSOCKET_URL: envField.string({
                context: "client",
                access: "public",
                default: "",
            }),
            SKIN_ENDPOINT: envField.string({
                context: "server",
                access: "public",
                default: "https://crafthead.net/helm/%s/8.png",
            }),
            GLOBAL_CACHE: envField.boolean({
                context: "server",
                access: "public",
                // cloudflare workers doesn't like us keeping a global cache and periodically throws 500s
                // because of this; promises which are started by one request are not allowed to be resolved
                // by another request, which completely breaks a cross-request cache without a proper replacement...
                default: false,
            }),
            ICE_SERVER: envField.string({
                context: "client",
                access: "public",
                default: "stun:stun.l.google.com:19302",
            }),
            ICE_SERVER_USER: envField.string({
                context: "client",
                access: "public",
                optional: true,
            }),
            ICE_SERVER_AUTH: envField.string({
                context: "client",
                access: "public",
                optional: true,
            }),
        },
    },

    vite: {
        plugins: [
            tailwindcss(),
            Icons({compiler: "jsx", jsx: "preact"}),
        ],
        define: {
            "import.meta.env.GIT_COMMIT_HASH": JSON.stringify(GIT_COMMIT_HASH),
        },
        build: {
            sourcemap: true,
        },
    },
});
