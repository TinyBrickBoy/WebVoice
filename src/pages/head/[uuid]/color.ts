import type {APIRoute} from "astro";
import {UUID, uuidFromString} from "../../../scripts/util/uuid.ts";
import {respondJson} from "../../../scripts/util/apiutil.ts";
import {getOrFetchHeadColor} from "../../../scripts/util/crafthead.ts";

export const GET: APIRoute = async ({params: {uuid: uuidStr}}) => {
    let uuid: UUID;
    try {
        uuid = uuidFromString(uuidStr!!);
    } catch (error) {
        return respondJson({error}, 400);
    }
    const resp = await getOrFetchHeadColor(uuid);
    if (!resp.color || resp.error) {
        return respondJson({error: resp.error}, resp.status);
    }
    return respondJson({color: resp.color}, resp.status);
};
