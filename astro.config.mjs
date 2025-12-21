import {defineConfig, envField} from "astro/config";
import preact from "@astrojs/preact";
import cloudflare from "@astrojs/cloudflare";
import tailwindcss from "@tailwindcss/vite";
import Icons from "unplugin-icons/vite";
import {execSync} from "node:child_process";

const GIT_COMMIT_HASH = (process.env.GITHUB_SHA || "").trim().slice(0, 7) || execSync("git rev-parse --short HEAD").toString().trim();

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
            DEFAULT_WEBSOCKET_URL: envField.string({
                context: "client",
                access: "public",
                default: "",
            }),
            SKIN_ENDPOINT: envField.string({
                context: "server",
                access: "public",
                // I would rather use crafthead.net, but they have some weird SSL things going on;
                // the default NodeJS runtime doesn't recognize Cloudflare-Signed SSL Certificates
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
    },
});
