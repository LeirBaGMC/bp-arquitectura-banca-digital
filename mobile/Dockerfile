# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS dependencies
WORKDIR /app

COPY mobile/package.json mobile/package-lock.json ./
RUN chown node:node /app
USER node
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS development
WORKDIR /app
RUN chown node:node /app

ENV NODE_ENV=development \
    EXPO_NO_TELEMETRY=1 \
    NPM_CONFIG_CACHE=/tmp/npm-cache

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node mobile/package.json mobile/package-lock.json ./
COPY --chown=node:node mobile/ ./

USER node
EXPOSE 8081
CMD ["npx", "expo", "start", "--host", "lan", "--port", "8081"]
