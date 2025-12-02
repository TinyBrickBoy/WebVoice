import {defineMiddleware} from "astro/middleware";
import {respondRedirect, TOKEN_LENGTH} from "./scripts/util/util.ts";

export const onRequest = defineMiddleware((ctx, next) => {
    const token = ctx.params.token;
    if (typeof token === "undefined") {
        return next();
    }
    // validate token length
    if (token.length !== TOKEN_LENGTH) {
        return respondRedirect();
    }
    return next();
});
