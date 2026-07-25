# ── build ────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS build
WORKDIR /app

# Install from the lockfile so the image matches what was tested locally.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# Drop dev dependencies so they don't ship in the runtime image.
RUN npm prune --omit=dev

# ── runtime ──────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./

# Don't run as root.
USER node

# The host injects PORT; main.ts reads it and binds 0.0.0.0.
EXPOSE 4000
CMD ["node", "dist/main"]
