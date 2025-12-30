import type {APIRoute} from "astro";
import {respondJson} from "../../../scripts/util/apiutil.ts";
import {CACHE_DURATION_SEC, getOrFetchHead, validateInput} from "../../../scripts/util/crafthead.ts";

export const GET: APIRoute = async ({params: {input}}) => {
    const validatedInput = validateInput(input);
    if (!validatedInput) {
        return respondJson({error: "invalid input"}, 400);
    }
    const resp = await getOrFetchHead(validatedInput);
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
