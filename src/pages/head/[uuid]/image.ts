import type {APIRoute} from "astro";
import {UUID, uuidFromString} from "../../../scripts/util/uuid.ts";
import {respondJson} from "../../../scripts/util/apiutil.ts";
import {CACHE_DURATION_SEC, getOrFetchHead} from "../../../scripts/util/crafthead.ts";

export const GET: APIRoute = async ({params: {uuid: uuidStr}}) => {
    let uuid: UUID;
    try {
        uuid = uuidFromString(uuidStr!!);
    } catch (error) {
        return respondJson({error}, 400);
    }
    const resp = await getOrFetchHead(uuid);
    if (!resp.image || resp.error) {
        return respondJson(
            {error: resp.error}, resp.status, {
                "Cache-Control": `max-age=${CACHE_DURATION_SEC}`,
            },
        );
    }
    return new Response(resp.image, {
        status: resp.status,
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": `max-age=${CACHE_DURATION_SEC}`,
        },
    });
};
