import type {UUID} from "./uuid.ts";
import {boostVibrance, convertHslToRgb, getAverageHSL, packRgb} from "./image_colors.ts";
import {decode as decodePng} from "fast-png";

export const buildHeadUrl = (uuid: UUID) => {
    // TODO NodeJS doesn't seem to recognize Cloudflare's SSL Certificates?
    // return `https://crafthead.net/helm/${uuid.name}/8`;
    return `https://cravatar.eu/helmavatar/${uuid.name}/8.png`;
};

export type HeadResponse = {
    image: Buffer | null,
    error: "not_found" | "unexpected" | null,
    status: number,
}
export type HeadColorResponse = HeadResponse & {
    color: number | null
}

const heads = new Map<string, HeadResponse>();
const colors = new Map<string, HeadColorResponse>();

export const getOrFetchHeadColor = async (uuid: UUID) => {
    let respObj = colors.get(uuid.name);
    if (respObj) {
        return respObj;
    }
    const head = await getOrFetchHead(uuid);
    let color: number | null = null;
    if (head.image) {
        const image = decodePng(head.image, {checkCrc: true});
        let [h, s, l] = getAverageHSL(image);
        [h, s, l] = boostVibrance(h, s, l); // apply a little boost
        const [r, g, b] = convertHslToRgb(h, s, l);
        color = packRgb(r, g, b);
    }
    respObj = {...head, color};
    colors.set(uuid.name, respObj);
    return respObj;
};

export const getOrFetchHead = async (uuid: UUID) => {
    let respObj = heads.get(uuid.name);
    if (respObj) {
        return respObj;
    }
    const resp = await fetch(buildHeadUrl(uuid));
    respObj = {image: null, error: "unexpected", status: resp.status};
    if (resp.status === 404) {
        respObj.error = "not_found";
    } else if (resp.status === 200) {
        respObj.image = Buffer.from(await resp.arrayBuffer());
        respObj.error = null;
    } else {
        respObj.error = "unexpected";
    }
    heads.set(uuid.name, respObj);
    return respObj;
};
