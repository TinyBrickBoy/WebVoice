import {defineMiddleware} from "astro/middleware";
import {respondRedirect} from "./scripts/util.ts";

export const onRequest = defineMiddleware((ctx, next) => {
    const token = ctx.params.token;
    if (typeof token === "undefined") {
        return next();
    }
    // validate token length
    if (token.length !== 20) {
        return respondRedirect();
    }
    return next();
});