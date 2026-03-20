FROM --platform=$TARGETOS/$TARGETARCH node:22-alpine AS builder

RUN apk add --no-cache --update git

USER node
WORKDIR /work
COPY --chown=node:node ./ /work

ARG DESIGNER_MODE=false
ARG DEFAULT_WEBSOCKET_URL
ARG SKIN_ENDPOINT="https://crafthead.net/helm/%s/8.png"
ARG GLOBAL_CACHE=true
ARG ICE_SERVER=stun:stun.l.google.com:19302
ARG ICE_SERVER_USER=""
ARG ICE_SERVER_AUTH=""
ARG ASTRO_SITE

ENV DOCKER=1
ENV NODE_ENV=production
RUN yarn install && yarn run build

FROM --platform=$TARGETOS/$TARGETARCH node:22-alpine

USER node
WORKDIR /app
COPY --from=builder --chown=node:node /work/dist /app/dist
COPY --from=builder --chown=node:node /work/node_modules /app/node_modules

ENV HOST=0.0.0.0
ENV PORT=8080

ENTRYPOINT ["/usr/bin/env"]
CMD ["/usr/local/bin/node", "/app/dist/server/entry.mjs"]
