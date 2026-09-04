# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- deps: install all dependencies (needed for dev + build) ----
FROM base AS deps
COPY package.json package-lock.json ./
COPY src/database/prisma ./src/database/prisma
COPY prisma.config.ts ./
# postinstall runs `prisma generate`, which only reads the schema — a
# placeholder DATABASE_URL satisfies prisma.config.ts without a live DB.
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm ci

# ---- dev: hot-reload dev server, source is bind-mounted at runtime ----
# (the bind mount at runtime shadows this COPY, but `prisma generate` still
# runs on container start via the compose command since the mount hides
# src/database/generated too)
FROM base AS dev
ENV NODE_ENV=development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
EXPOSE 3000
CMD ["npm", "run", "dev"]

# ---- build: compile TypeScript to dist/ ----
FROM base AS build
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npx prisma generate
RUN npm run build

# ---- prod-deps: production-only node_modules ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
COPY src/database/prisma ./src/database/prisma
COPY prisma.config.ts ./
RUN DATABASE_URL="postgresql://build:build@localhost:5432/build" npm ci --omit=dev

# ---- prod: minimal runtime image ----
FROM base AS prod
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S spotly -G nodejs
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/src/database/prisma ./src/database/prisma
COPY --from=build /app/src/database/migrations ./src/database/migrations
COPY --from=build /app/prisma.config.ts ./
COPY package.json ./
USER spotly
EXPOSE 3000
CMD ["node", "dist/app/server.js"]
