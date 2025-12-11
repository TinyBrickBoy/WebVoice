import type {UUID} from "./uuid.ts";
import {boostVibrance, convertHslToRgb, getAverageHSL, packRgb} from "./image_colors.ts";
import {decode as decodePng} from "fast-png";
import {SKIN_ENDPOINT} from "astro:env/server";
import {format} from "node:util";
import {CachedMap} from "./cached_map.ts";

export const buildHeadUrl = (uuid: UUID) => format(SKIN_ENDPOINT, uuid.name);

export type HeadResponse = {
    image: Buffer | null,
    error: "not_found" | "unexpected" | null,
    status: number,
}
export type HeadColorResponse = HeadResponse & {
    color: number | null
}

const CACHE_DURATION_MS = 1000n * 60n * 3n; // cache for 3min
const heads = new CachedMap<string, HeadResponse>(CACHE_DURATION_MS);
const colors = new CachedMap<string, HeadColorResponse>(CACHE_DURATION_MS);

export const getOrFetchHeadColor = async (uuid: UUID) => {
    return colors.getOrLoad(uuid.name, async () => {
        const head = await getOrFetchHead(uuid);
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
    });
};

export const getOrFetchHead = async (uuid: UUID) => {
    return heads.getOrLoad(uuid.name, async () => {
        const resp = await fetch(buildHeadUrl(uuid));
        if (resp.status === 404) {
            // player can't be found, return 404 error
            return {error: "not_found", image: null, status: resp.status} as HeadResponse;
        } else if (resp.status !== 200) {
            // unexpected error code, we only accept 200
            return {error: "unexpected", image: null, status: resp.status} as HeadResponse;
        }
        // read the whole image and save response
        return {error: null, image: Buffer.from(await resp.arrayBuffer()), status: 200} as HeadResponse;
    });
};
