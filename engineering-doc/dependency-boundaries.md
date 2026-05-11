# Workspace Dependency Boundaries

Guidora uses workspace packages for shared contracts and primitives. Apps must not import each other directly.

## Allowed Imports

- `apps/web` may import `@guidora/contracts`, `@guidora/domain`, `@guidora/ui`, and typed API clients.
- `apps/api` may import `@guidora/contracts`, `@guidora/db`, `@guidora/domain`, `@guidora/integrations`, and `@guidora/test-utils` in tests.
- `packages/contracts` must not import app code or database runtime code.
- `packages/db` owns Prisma schema, migrations, generated client, seed data, and database test safety helpers.
- `packages/ui` must not import API or database code.

These boundaries are reviewed in code review and should be mirrored by lint rules as the shared config package is expanded.
