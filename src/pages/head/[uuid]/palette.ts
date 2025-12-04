import type {APIRoute} from "astro";
import {UUID, uuidFromString} from "../../../scripts/util/uuid.ts";
import {respondJson} from "../../../scripts/util/apiutil.ts";
import {getOrFetchHeadPalette} from "../../../scripts/util/crafthead.ts";

export const GET: APIRoute = async ({params: {uuid: uuidStr}}) => {
    let uuid: UUID;
    try {
        uuid = uuidFromString(uuidStr!!);
    } catch (error) {
        return respondJson({error}, 400);
    }
    const resp = await getOrFetchHeadPalette(uuid);
    if (!resp.palette || resp.error) {
        return respondJson({error: resp.error}, resp.status);
    }
    return respondJson(resp.palette, resp.status);
};
