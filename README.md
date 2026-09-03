# Spotly Backend

## Getting Started

```bash
cp .env.example .env
npm install
npm run prisma:migrate:dev
npm run dev
```

`npm install` runs `prisma generate` automatically via `postinstall`.

## Scripts

- `npm run dev` — start the dev server with hot reload
- `npm run build` — compile TypeScript to `dist/`
- `npm start` — run the compiled server
- `npm run lint` / `npm run lint:fix` — lint the codebase
- `npm run format` / `npm run format:check` — format with Prettier
- `npm run typecheck` — type-check without emitting
- `npm run prisma:generate` — regenerate the Prisma client
- `npm run prisma:migrate:dev` — create/apply a migration in development
- `npm run prisma:migrate:deploy` — apply pending migrations (CI/production)
- `npm run prisma:studio` — open Prisma Studio
- `npm run db:seed` — run the database seed script

## Database

- Schema lives in [src/database/prisma/](src/database/prisma/), split by domain (`models/*.prisma`) plus a root [schema.prisma](src/database/prisma/schema.prisma) with the datasource/generator.
- Prisma config (schema path, migrations path, driver adapter) is in [prisma.config.ts](prisma.config.ts).
- The generated client is written to `src/database/generated/client` (gitignored, regenerated on install/build) and re-exported from [src/database/client.ts](src/database/client.ts) as a singleton `prisma` instance backed by a `pg` connection pool.
- Use `runInTransaction` from [src/database/transactions/transaction.ts](src/database/transactions/transaction.ts) for multi-step writes.
- Migrations are written to [src/database/migrations/](src/database/migrations/).

## Health Check

```
GET /api/health          # liveness — no dependencies
GET /api/health/ready     # readiness — checks database connectivity
```
