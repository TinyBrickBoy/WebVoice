import {boostVibrance, convertHslToRgb, getAverageHSL, packRgb} from "./image_colors.ts";
import {decode as decodePng} from "fast-png";
import {GLOBAL_CACHE, SKIN_ENDPOINT} from "astro:env/server";
import {CachedMap} from "./cached_map.ts";
import {uuidFromString} from "./uuid.ts";

const TEXTURE_SHA256_HASH_BYTES = 256 / 8;

export const validateInput = (input?: string) => {
    if (!input) {
        return null;
    }
    // validate sha256 texture hashes
    if (input.length === TEXTURE_SHA256_HASH_BYTES * 2) {
        const hashBuf = Buffer.from(input, "hex");
        if (hashBuf.length !== TEXTURE_SHA256_HASH_BYTES) {
            return null; // invalid input
        }
        return hashBuf.toString("hex");
    }
    // validate uuids
    try {
        return uuidFromString(input).toString();
    } catch (error) {
        return null;
    }
};

export const buildHeadUrl = (input: string) => SKIN_ENDPOINT.replace("%s", input);

export type HeadResponse = {
    image: Buffer | null,
    error: "not_found" | "unexpected" | null,
    status: number,
}
export type HeadColorResponse = HeadResponse & {
    color: number | null
}

export const CACHE_DURATION_SEC = 60n * 3n; // cache for 3min
export const CACHE_DURATION_MS = 1000n * CACHE_DURATION_SEC;
const heads = GLOBAL_CACHE ? new CachedMap<string, HeadResponse>(CACHE_DURATION_MS) : null;
const colors = GLOBAL_CACHE ? new CachedMap<string, HeadColorResponse>(CACHE_DURATION_MS) : null;

const generateHeadColor = (head: HeadResponse): HeadColorResponse => {
    if (!head.image) {
        return {...head, color: null} as HeadColorResponse;
    }
    // decode png buffer to data + palette
    const image = decodePng(head.image, {checkCrc: true});
    // get average HSL values
    let [h, s, l] = getAverageHSL(image);
    // apply a little boost in vibrance
    [h, s, l] = boostVibrance(h, s, l);
    // convert back to rgb values
    const [r, g, b] = convertHslToRgb(h, s, l);
    // finish writing response
    return {...head, color: packRgb(r, g, b)} as HeadColorResponse;
};

export const getOrFetchHeadColor = async (input: string) => {
    if (!colors) {
        // cloudflare workers will cache the outgoing http request for us
        return generateHeadColor(await fetchHeadImage(input));
    }
    return colors.getOrLoad(input, async () => {
        return generateHeadColor(await getOrFetchHead(input));
    });
};

const fetchHeadImage = async (input: string) => {
    const resp = await fetch(buildHeadUrl(input), {
        headers: {
            "User-Agent": "SonusWeb (https://github.com/MinceraftMC/SonusWeb, mailto:contact@minceraft.dev)",
        },
        // @ts-ignore force cloudflare workers caching
        cf: {
            cacheTtl: Number(CACHE_DURATION_SEC),
            cacheEverything: true,
        },
    });

    if (resp.status === 404) {
        // player can't be found, return 404 error
        return {error: "not_found", image: null, status: resp.status} as HeadResponse;
    } else if (resp.status !== 200) {
        // unexpected error code, we only accept 200
        return {error: "unexpected", image: null, status: resp.status} as HeadResponse;
    }
    // read the whole image and save response
    return {error: null, image: Buffer.from(await resp.arrayBuffer()), status: 200} as HeadResponse;
};

export const getOrFetchHead = (input: string) => {
    if (!heads) {
        return fetchHeadImage(input);
    }
    return heads.getOrLoad(input, async () => fetchHeadImage(input));
};
