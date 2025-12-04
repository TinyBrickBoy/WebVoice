import type {UUID} from "./uuid.ts";
import {Vibrant} from "node-vibrant/node";
import type {Palette} from "@vibrant/color";

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
export type HeadPaletteResponse = HeadResponse & {
    palette: Palette | null
}

const heads = new Map<string, HeadResponse>();
const palettes = new Map<string, HeadPaletteResponse>();

export const getOrFetchHeadPalette = async (uuid: UUID) => {
    let respObj = palettes.get(uuid.name);
    if (respObj) {
        return respObj;
    }
    const head = await getOrFetchHead(uuid);
    const palette = head.image ? await Vibrant.from(head.image).getPalette() : null;
    respObj = {...head, palette};
    palettes.set(uuid.name, respObj);
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
