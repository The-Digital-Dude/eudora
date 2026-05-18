# Guidora

Guidora is a pnpm and Turborepo monorepo with a Next.js console app, NestJS REST API, PostgreSQL, Prisma 7, shared contracts, shared database package, and shared UI package.

## Requirements

- Node.js 24 or newer
- pnpm 11.1.2 or newer
- Docker for local PostgreSQL

## Setup

```bash
pnpm install
Copy-Item .env.example .env
docker compose up -d postgres
pnpm db:generate
pnpm db:migrate:dev
pnpm dev
```

The console app runs on `http://localhost:3002`.

The API runs on `http://localhost:3001`.

Swagger/OpenAPI docs are available at `http://localhost:3001/docs`.

PostgreSQL is exposed on host port `5433` to avoid collisions with an existing local PostgreSQL server on the default `5432`.

## Verification

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```
