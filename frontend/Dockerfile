# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim AS dependencies
WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./
RUN chown node:node /app
USER node
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS development
WORKDIR /app

ENV NODE_ENV=development \
    NPM_CONFIG_CACHE=/tmp/npm-cache

COPY --from=dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node frontend/package.json frontend/package-lock.json ./
COPY --chown=node:node frontend/ ./

USER node
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--strictPort"]
