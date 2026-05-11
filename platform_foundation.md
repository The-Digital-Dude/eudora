# E0 Platform Foundation Implementation Details

**Goal:** Build a scalable Turbo monorepo foundation for Guidora using pnpm workspaces, Turborepo, Next.js, NestJS, Prisma ORM, PostgreSQL, Tailwind CSS, and strict TypeScript before Pilot 1 feature modules begin.

**Architecture:** Use a workspace-based modular platform. The Next.js web app owns user-facing routes and server-rendered UI. The NestJS API owns application services, domain workflows, authorization, audit, background jobs, and integration boundaries. Shared packages provide typed contracts, validation schemas, UI primitives, config, lint/TypeScript presets, and test utilities. Prisma/PostgreSQL remain the source of truth, and external systems are accessed only through adapter interfaces.

**Tech Stack:** Turborepo, pnpm workspace, TypeScript strict mode, Next.js App Router, React, Tailwind CSS, NestJS, Prisma ORM, PostgreSQL, Zod, React Hook Form, Vitest or Jest, Playwright, managed auth provider, S3-compatible storage adapter, payment/email/SMS adapters, structured logs, Sentry or equivalent monitoring.

---

## 1. Implementation Principles

- Build `E0` before domain workflows. Later epics depend on workspace structure, API contracts, database access, auth, authorization, audit, test harnesses, provider interfaces, and environment configuration.
- Keep app and package boundaries explicit. App-specific code belongs in `apps/web` or `apps/api`; reusable contracts and utilities belong in `packages/*`.
- Use NestJS services, modules, guards, interceptors, and transactions for backend business behavior. Keep Next.js route handlers thin and prefer calling the API or shared server clients.
- Treat PostgreSQL as source of truth. External providers mirror state into internal tables; they do not own application state.
- Share types through packages, not by importing app internals across workspace boundaries.
- Never commit secrets. Use `.env.example` and deployment docs for variable names and environment-specific guidance.
- Write foundation tests so later teams copy stable monorepo patterns.

## 2. Monorepo Workspace Structure

Create or prepare these paths during `E0`:

```text
apps/
  web/
    src/
      app/
        (auth)/
        (admin)/
        (teacher)/
        (parent)/
        (student)/
      components/
        app-shell/
      lib/
        api-client/
        auth/
        env/
    tests/
      e2e/
      unit/
    next.config.ts
    tailwind.config.ts
    tsconfig.json
  api/
    src/
      app.module.ts
      main.ts
      modules/
        academic/
        assignments/
        audit/
        attendance/
        billing/
        classes/
        communication/
        crm/
        enrolment/
        identity/
        imports/
        makeups/
        payments/
        reporting/
      common/
        auth/
        errors/
        filters/
        guards/
        interceptors/
        logging/
        permissions/
        validation/
      health/
      integrations/
      jobs/
    tests/
      e2e/
      integration/
      unit/
    nest-cli.json
    tsconfig.json
packages/
  config/
    eslint/
    typescript/
    tailwind/
  contracts/
    src/
      api/
      auth/
      errors/
      permissions/
      validation/
  db/
    prisma/
      migrations/
      schema.prisma
      seed.ts
    src/
      client.ts
      test-database.ts
    prisma.config.ts
  domain/
    src/
      dates/
      money/
      references/
      security/
  integrations/
    src/
      email/
      payment/
      sms/
      storage/
      provider-registry.ts
  test-utils/
    src/
      actors.ts
      seed-handles.ts
      database.ts
  ui/
    src/
      components/
      styles/
      tailwind.css
engineering-doc/
  developer-setup.md
  deployment-runbook.md
  provider-smoke-test-checklist.md
  privacy-consent-retention-policy.md
.github/
  workflows/
    ci.yml
.env.example
package.json
pnpm-workspace.yaml
pnpm-lock.yaml
turbo.json
tsconfig.base.json
```

Workspace package naming convention:

```text
@guidora/web
@guidora/api
@guidora/config
@guidora/contracts
@guidora/db
@guidora/domain
@guidora/integrations
@guidora/test-utils
@guidora/ui
```

## 3. Task E0.F1.T1: Create Turbo and pnpm Workspace Foundation

### Scope

Establish the root monorepo, pnpm workspace configuration, Turborepo pipeline, shared TypeScript configuration, package naming conventions, and app/package dependency boundaries.

### Implementation Details

Create root files:

```text
package.json
pnpm-workspace.yaml
turbo.json
tsconfig.base.json
.gitignore
.env.example
```

Root `package.json` should define workspace-level commands:

```json
{
  "private": true,
  "packageManager": "pnpm@latest",
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "test:unit": "turbo test:unit",
    "test:integration": "turbo test:integration",
    "test:e2e": "turbo test:e2e",
    "format": "prettier --write .",
    "db:format": "pnpm --filter @guidora/db prisma:format",
    "db:validate": "pnpm --filter @guidora/db prisma:validate",
    "db:generate": "pnpm --filter @guidora/db prisma:generate",
    "db:migrate:dev": "pnpm --filter @guidora/db prisma:migrate:dev",
    "db:migrate:deploy": "pnpm --filter @guidora/db prisma:migrate:deploy",
    "db:seed": "pnpm --filter @guidora/db prisma:seed"
  }
}
```

`pnpm-workspace.yaml` should include:

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

`turbo.json` should define cached and uncached tasks:

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**", "!.next/cache/**"]
    },
    "lint": {
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "dependsOn": ["^build"]
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:unit": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"]
    },
    "test:integration": {
      "dependsOn": ["^build"],
      "cache": false
    },
    "test:e2e": {
      "dependsOn": ["build"],
      "cache": false
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

Boundary rules:

- `apps/web` may import `@guidora/contracts`, `@guidora/domain`, `@guidora/ui`, and typed API clients.
- `apps/api` may import `@guidora/contracts`, `@guidora/db`, `@guidora/domain`, `@guidora/integrations`, and `@guidora/test-utils` in tests.
- `packages/contracts` must not import app code or database runtime code.
- `packages/db` owns Prisma schema, migrations, generated client, seed data, and database test safety helpers.
- `packages/ui` must not import API or database code.

### Acceptance Checks

- `pnpm install` creates a lockfile.
- `pnpm build`, `pnpm typecheck`, `pnpm lint`, and `pnpm test` run through Turbo.
- Package dependency boundaries are documented and enforced through lint or review checks.
- No app imports another app directly.

### Suggested Steps

- [ ] Create root workspace files.
- [ ] Add Turborepo pipeline.
- [ ] Add shared TypeScript config.
- [ ] Add package naming conventions.
- [ ] Add initial workspace scripts.
- [ ] Run `pnpm install` and `pnpm typecheck`.

## 4. Task E0.F1.T2: Scaffold Next.js Web App

### Scope

Create the `apps/web` Next.js App Router project with Tailwind CSS, strict TypeScript, route groups, role shell placeholders, and shared UI package integration.

### Implementation Details

- Create a Next.js App Router app at `apps/web`.
- Enable strict TypeScript and inherit from `tsconfig.base.json`.
- Configure Tailwind CSS to scan `apps/web/src` and `packages/ui/src`.
- Use route groups:
  - `apps/web/src/app/(auth)` for sign-in, sign-out, invite, and account linking routes.
  - `apps/web/src/app/(admin)` for owner/admin/billing/academic staff surfaces.
  - `apps/web/src/app/(teacher)` for teacher daily workflows.
  - `apps/web/src/app/(parent)` for parent portal routes.
  - `apps/web/src/app/(student)` for student task portal routes.
- Create placeholder pages:
  - `apps/web/src/app/(admin)/page.tsx`
  - `apps/web/src/app/(teacher)/page.tsx`
  - `apps/web/src/app/(parent)/page.tsx`
  - `apps/web/src/app/(student)/page.tsx`
- Create `apps/web/src/components/app-shell/AppShell.tsx` with role-aware navigation slots.
- Keep API access behind `apps/web/src/lib/api-client` or a shared generated client.

### Acceptance Checks

- `pnpm --filter @guidora/web build` succeeds.
- Placeholder routes render without runtime errors.
- Tailwind classes compile in both app and shared UI package components.
- Web app does not import NestJS internals or Prisma runtime code.

### Suggested Steps

- [ ] Scaffold `apps/web`.
- [ ] Configure Tailwind and TypeScript inheritance.
- [ ] Add route groups and placeholder pages.
- [ ] Add `AppShell`.
- [ ] Add web route smoke tests.
- [ ] Run `pnpm --filter @guidora/web build`.

## 5. Task E0.F1.T3: Scaffold NestJS API App

### Scope

Create the `apps/api` NestJS application with strict TypeScript, module layout, global validation, typed errors, health endpoints, request logging, and OpenAPI-ready controller conventions.

### Implementation Details

Create or prepare:

```text
apps/api/src/main.ts
apps/api/src/app.module.ts
apps/api/src/common/errors/domain-errors.ts
apps/api/src/common/filters/domain-error.filter.ts
apps/api/src/common/validation/zod-validation.pipe.ts
apps/api/src/common/auth/current-user.decorator.ts
apps/api/src/common/guards/auth.guard.ts
apps/api/src/common/guards/permission.guard.ts
apps/api/src/health/health.module.ts
apps/api/src/health/health.controller.ts
apps/api/src/modules/*/*.module.ts
```

NestJS conventions:

- Each domain module owns its controller, service, repository, DTOs, and tests.
- Controllers validate input and call services; they do not contain business rules.
- Services own transactions and domain behavior.
- Repositories call Prisma through `@guidora/db`.
- Guards enforce authentication, RBAC, and ownership checks before mutation.
- Global filters serialize domain errors into shared API response contracts.

Required API health routes:

```text
GET /health
GET /health/db
GET /health/integrations
```

### Acceptance Checks

- `pnpm --filter @guidora/api build` succeeds.
- Health endpoints return safe status without secrets.
- API app imports shared packages through workspace aliases.
- Global validation and error serialization are registered in `main.ts`.

### Suggested Steps

- [ ] Scaffold `apps/api`.
- [ ] Add domain module directories.
- [ ] Add global validation pipe and domain error filter.
- [ ] Add health module and controller.
- [ ] Add sample protected controller.
- [ ] Run `pnpm --filter @guidora/api build`.

## 6. Task E0.F1.T4: Configure Shared Packages

### Scope

Create shared packages for contracts, domain primitives, UI, integrations, config, and test utilities.

### Implementation Details

Create:

```text
packages/contracts/src/api/responses.ts
packages/contracts/src/errors/error-codes.ts
packages/contracts/src/auth/actor-context.ts
packages/contracts/src/permissions/permissions.ts
packages/contracts/src/validation/index.ts
packages/domain/src/dates/centre-time.ts
packages/domain/src/money/money.ts
packages/domain/src/references/record-registry.ts
packages/domain/src/security/privacy-policy.ts
packages/ui/src/components/
packages/ui/src/styles/tailwind.css
packages/integrations/src/payment/payment-adapter.ts
packages/integrations/src/email/email-adapter.ts
packages/integrations/src/sms/sms-adapter.ts
packages/integrations/src/storage/storage-adapter.ts
packages/test-utils/src/actors.ts
packages/test-utils/src/database.ts
```

Use this response shape in `@guidora/contracts`:

```ts
export type ApiSuccess<T> = {
  data: T;
  meta?: {
    requestId?: string;
  };
};

export type ApiList<T> = {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };
  meta?: {
    requestId?: string;
  };
};

export type ApiFailure = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};
```

Foundation error codes:

```text
AUTHENTICATION_REQUIRED
AUTHENTICATED_USER_NOT_LINKED
USER_DISABLED
FORBIDDEN
VALIDATION_ERROR
NOT_FOUND
CONFLICT
ILLEGAL_STATE_TRANSITION
IDEMPOTENCY_CONFLICT
PROVIDER_ERROR
INTERNAL_ERROR
```

Money helpers must use integer minor units:

```ts
export type Money = {
  amountMinor: number;
  currency: "AUD";
};
```

Required money behavior:

- Reject `NaN`, `Infinity`, floating-point minor-unit values, and mismatched currencies.
- Add and subtract only same-currency values.
- Format display without changing persisted amount.

Date helper rules:

- Persist timestamps in UTC.
- Use centre timezone from config, defaulting to `Australia/Sydney` unless the centre confirms another timezone.
- Never derive billing or attendance dates from the browser timezone.

### Acceptance Checks

- Shared packages build independently.
- Web and API consume `@guidora/contracts` without circular dependencies.
- Money tests prove no floating-point arithmetic enters persisted values.
- Date tests cover UTC storage and centre-time display.
- UI package styles are usable from `apps/web`.

### Suggested Steps

- [ ] Create package manifests and `tsconfig.json` files.
- [ ] Add contracts package.
- [ ] Add domain primitives.
- [ ] Add UI package and Tailwind preset.
- [ ] Add integration interfaces.
- [ ] Add test utilities.
- [ ] Run `pnpm build --filter './packages/*'`.

## 7. Task E0.F2.T1: Configure Prisma ORM and PostgreSQL Package

### Scope

Make `packages/db` own Prisma schema, migrations, client generation, seed data, and database test safety rules.

### Implementation Details

Create:

```text
packages/db/prisma/schema.prisma
packages/db/prisma/migrations/
packages/db/prisma/seed.ts
packages/db/prisma.config.ts
packages/db/src/client.ts
packages/db/src/test-database.ts
packages/db/package.json
```

`packages/db/package.json` scripts:

```json
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "typecheck": "tsc --noEmit",
    "prisma:format": "prisma format --schema prisma/schema.prisma",
    "prisma:validate": "prisma validate --schema prisma/schema.prisma",
    "prisma:generate": "prisma generate --schema prisma/schema.prisma",
    "prisma:migrate:dev": "prisma migrate dev --schema prisma/schema.prisma",
    "prisma:migrate:deploy": "prisma migrate deploy --schema prisma/schema.prisma",
    "prisma:seed": "prisma db seed --schema prisma/schema.prisma"
  }
}
```

`packages/db/src/client.ts` should:

- Export a singleton Prisma client for API runtime.
- Avoid opening multiple clients during local hot reload and tests.
- Keep logs configurable by environment.
- Be imported by API repositories, not by web UI code.

`.env.example` should include:

```text
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DIRECT_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
AUTH_PROVIDER_SECRET=
AUTH_PROVIDER_PUBLIC_KEY=
PAYMENT_PROVIDER_SECRET=
PAYMENT_WEBHOOK_SECRET=
EMAIL_PROVIDER_SECRET=
SMS_PROVIDER_SECRET=
STORAGE_ACCESS_KEY_ID=
STORAGE_SECRET_ACCESS_KEY=
STORAGE_BUCKET=
STORAGE_REGION=
SENTRY_DSN=
WEB_BASE_URL=http://localhost:3000
API_BASE_URL=http://localhost:3001
CENTRE_TIMEZONE=Australia/Sydney
```

Test database safety rule:

- Integration tests must refuse to run unless `DATABASE_URL` contains a dedicated test database name such as `_test` or `test`.
- Test reset scripts must never run against staging or production URLs.

### Acceptance Checks

- `pnpm db:format` succeeds.
- `pnpm db:validate` succeeds.
- `pnpm db:generate` succeeds.
- API repositories can use Prisma through `@guidora/db`.
- No database URL or secret is committed.

### Suggested Steps

- [ ] Add database package.
- [ ] Add Prisma schema and config.
- [ ] Add Prisma client singleton.
- [ ] Add database safety helpers.
- [ ] Update `.env.example`.
- [ ] Run Prisma format, validate, and generate.

## 8. Task E0.F2.T2: Create Initial Migration and Seed Data

### Scope

Convert the canonical Prisma schema into a deployable baseline and seed role-aware data needed for tests and local development.

### Implementation Details

Create:

```text
packages/db/prisma/migrations/<timestamp>_initial/migration.sql
packages/db/prisma/seed.ts
packages/test-utils/src/seed-handles.ts
```

Seed handles should include:

```text
centre.main
user.owner
user.admin
user.academicLead
user.teacher
user.billingAdmin
user.parent
user.student
family.sample
student.sample
class.sample
feePlan.standard
concept.sample
```

Minimum seed requirements:

- One centre.
- Roles for owner, admin, academic lead, teacher, tutor, billing admin, parent, student, and developer.
- Internal users mapped to fake provider IDs.
- One family account with one parent guardian and one student.
- One teacher-assigned class with active schedule data.
- One fee plan suitable for billing tests.
- One subject/strand/concept suitable for academic tests.

Enum verification:

- Compare schema enums against `engineering-doc/04-workflow-state-machines.md`.
- Record mismatches as implementation blockers before writing feature logic.

### Acceptance Checks

- Fresh local database can migrate and seed.
- Seed is repeatable.
- Tests can resolve seeded actors by stable handles.
- Seeded users can resolve into internal actor context after auth integration.

### Suggested Steps

- [ ] Generate initial Prisma migration.
- [ ] Review migration SQL before applying.
- [ ] Implement seed data with stable external references.
- [ ] Add seed handles fixture.
- [ ] Document reset, migrate, and seed commands.
- [ ] Run migration and seed on a local database.

## 9. Task E0.F2.T3: Add SQL-Only Integrity Constraints Prisma Cannot Express

### Scope

Protect high-risk uniqueness and overlap rules with explicit SQL migrations and tests.

### Implementation Details

Create:

```text
packages/db/prisma/migrations/<timestamp>_sql_integrity_constraints/migration.sql
apps/api/tests/integration/db/sql-constraints.test.ts
```

Add SQL constraints for:

1. One active payment plan per invoice.
2. One active alert per natural source.
3. Active enrolment overlap protection.
4. Idempotency uniqueness by actor/scope/key.

Constraint intent:

```sql
-- One active payment plan per invoice.
CREATE UNIQUE INDEX payment_plans_one_active_per_invoice_idx
ON payment_plans (invoice_id)
WHERE status = 'active';
```

```sql
-- One active alert task per natural source while unresolved.
CREATE UNIQUE INDEX alert_tasks_one_active_per_source_idx
ON alert_tasks (alert_type, related_record_type, related_record_id)
WHERE alert_status IN ('open', 'in_progress');
```

For enrolment overlaps, use the final schema field names from `packages/db/prisma/schema.prisma`. If the model uses date ranges, prefer PostgreSQL exclusion constraints. If the launch model uses discrete active rows without native range fields, implement a transaction-level service check plus the strongest feasible partial unique index.

For idempotency:

- User actor keys should be unique by `(actor_user_id, scope, idempotency_key)` when actor is present.
- System/provider actor keys should be unique by `(scope, idempotency_key)` plus provider/source identity when actor is absent.

### Acceptance Checks

- Duplicate active payment plan insert fails.
- Duplicate active alert insert fails.
- Unsafe active enrolment overlap fails.
- Duplicate idempotency key in the same scope fails.
- Migration comments explain why each constraint is SQL-only.

### Suggested Steps

- [ ] Write failing integration tests for each duplicate scenario.
- [ ] Add SQL migration with comments.
- [ ] Apply migration to local test database.
- [ ] Run integration tests and verify duplicates are rejected.
- [ ] Document any constraint that must be paired with service-level validation.

## 10. Task E0.F2.T4: Define Polymorphic Reference Contracts

### Scope

Prevent unsafe orphaned links for `submission_attachments`, `communication_logs`, and `alert_tasks`.

### Implementation Details

Create:

```text
packages/domain/src/references/record-registry.ts
packages/domain/src/references/assert-related-record.ts
apps/api/src/common/references/related-record-access.service.ts
apps/api/tests/integration/references/assert-related-record.test.ts
packages/domain/src/references/orphan-report.ts
```

Allowed owner types:

```ts
export const submissionAttachmentOwnerTypes = [
  "assessment_attempt",
  "homework_submission"
] as const;
```

Allowed communication related record types:

```text
family_account
student
lead
diagnostic_booking
enrolment
invoice
payment
payment_plan
missed_lesson
makeup_booking
assessment_attempt
homework_submission
alert_task
```

Allowed alert related record types:

```text
student
family_account
attendance_session
missed_lesson
makeup_booking
invoice
payment
payment_plan_instalment
communication_log
import_batch
assessment_attempt
homework_submission
evidence
mastery_record
```

Every polymorphic write must:

- Validate the type is in the registry.
- Confirm target record exists.
- Confirm actor can access the target.
- Use a NestJS service function, not raw UI payload passthrough.

### Acceptance Checks

- Unknown related record type is rejected.
- Known type with nonexistent ID is rejected.
- Known type with inaccessible target is rejected.
- Orphan report can identify records whose target no longer exists.

### Suggested Steps

- [ ] Add allowed type registries.
- [ ] Add target-existence resolvers.
- [ ] Add actor-access hooks.
- [ ] Add orphan-report query.
- [ ] Add unit and integration tests.

## 11. Task E0.F3.T1: Integrate Managed Authentication and Internal User Mapping

### Scope

Link external auth-provider users to internal `users` rows and application sessions.

### Implementation Details

Create:

```text
apps/api/src/common/auth/auth-provider.service.ts
apps/api/src/common/auth/current-user.service.ts
apps/api/src/common/auth/require-auth.guard.ts
apps/api/src/modules/identity/user-linking.service.ts
apps/api/src/modules/identity/invite.service.ts
apps/web/src/lib/auth/session.ts
packages/contracts/src/auth/actor-context.ts
apps/api/tests/unit/auth/current-user.service.test.ts
apps/api/tests/e2e/auth-boundary.e2e-spec.ts
```

Runtime flow:

```text
Request
  -> managed auth provider session
  -> provider user id
  -> API lookup users.auth_provider_user_id
  -> disabled-user check
  -> ActorContext
  -> NestJS guards and ownership checks
```

Required auth outcomes:

| Case | Result |
| --- | --- |
| No provider session | `AUTHENTICATION_REQUIRED` |
| Provider session exists but no internal user | `AUTHENTICATED_USER_NOT_LINKED` |
| Internal user disabled | `USER_DISABLED` |
| Internal user active | Actor context resolution continues |

Invite/onboarding rules:

- Staff accounts are invite-based.
- Parent/student accounts must link to parent guardian/student records before portal access.
- Provider user IDs are stored internally, but passwords and MFA state remain with the auth provider.

### Acceptance Checks

- Authenticated known provider user resolves to internal user.
- Disabled internal user is blocked.
- Unknown provider user is rejected with a typed error.
- Tests use auth doubles and do not require a live auth provider.
- Web app receives only session-safe actor data.

### Suggested Steps

- [ ] Add provider wrapper.
- [ ] Add internal user lookup.
- [ ] Add disabled-user guard.
- [ ] Add invite/linking service.
- [ ] Add auth test double.
- [ ] Add API boundary tests for all auth outcomes.

## 12. Task E0.F3.T2: Implement RBAC and Ownership Checks

### Scope

Enforce role and ownership boundaries server-side for every protected operation.

### Implementation Details

Create:

```text
packages/contracts/src/permissions/actor-context.ts
packages/contracts/src/permissions/permissions.ts
apps/api/src/common/permissions/assert-permission.ts
apps/api/src/common/permissions/ownership.service.ts
apps/api/src/common/guards/permission.guard.ts
apps/api/tests/unit/permissions/permissions.test.ts
apps/api/tests/integration/permissions/ownership.test.ts
```

Actor context:

```ts
export type ActorContext = {
  userId: string;
  providerUserId: string;
  roles: Array<
    | "owner"
    | "admin"
    | "academic_lead"
    | "teacher"
    | "tutor"
    | "billing_admin"
    | "parent"
    | "student"
    | "developer"
  >;
  centreIds: string[];
  familyAccountIds: string[];
  studentIds: string[];
  isDisabled: boolean;
};
```

Core ownership checks:

- Parent can access a student through `parent_guardians.family_account_id -> students.family_account_id` and only when parent portal access is enabled.
- Student can access only the student row linked to their internal user.
- Teacher can access students through assigned classes and active/current enrolments.
- Billing admin can access billing surfaces but not academic mastery override.
- Academic lead can access academic configuration and mastery/evidence workflows but not payment mutation paths.

Permission examples:

```text
crm.family.manage
student.profile.view
class.manage
enrolment.activate
attendance.mark
attendance.edit_submitted
makeup.manage
billing.invoice.manage
billing.payment.record
academic.concept.manage
academic.mastery.override
assignment.manage
student.task.submit
communication.send
import.commit
audit.view
user.role.manage
```

### Acceptance Checks

- Parent cannot access another family.
- Student cannot access another student's task.
- Teacher cannot access unassigned class/student.
- Non-billing user cannot edit invoice.
- Non-academic user cannot override mastery.
- Server checks are authoritative even if UI route is guessed directly.

### Suggested Steps

- [ ] Define actor context type.
- [ ] Define permission constants.
- [ ] Add role-to-permission mapping.
- [ ] Implement parent, student, and teacher ownership checks.
- [ ] Add billing and academic restricted checks.
- [ ] Add unit and integration tests.

## 13. Task E0.F3.T3: Implement Append-Only Audit Service

### Scope

Provide standardized audit writes for sensitive workflow boundaries.

### Implementation Details

Create:

```text
apps/api/src/modules/audit/audit.types.ts
apps/api/src/modules/audit/audit.service.ts
apps/api/src/modules/audit/audit.repository.ts
apps/api/src/modules/audit/require-reason.ts
apps/api/src/modules/audit/audit-query.service.ts
apps/api/tests/unit/audit/require-reason.test.ts
apps/api/tests/integration/audit/audit.service.test.ts
```

Audit event contract:

```ts
export type AuditEventInput = {
  actorUserId: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: unknown;
  newValue?: unknown;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};
```

Sensitive events requiring audit:

- Fee plan edit/approval.
- Discount/credit create/approve/apply/void.
- Invoice approve/send/void/refund.
- Manual payment/refund.
- Enrolment activation/override/transfer/withdrawal.
- Capacity override.
- Submitted attendance edit.
- Make-up override/waive/expire/rebook beyond policy.
- Concept framework edit.
- Mastery update/override.
- Role assignment/removal.
- Import commit.

Append-only rule:

- Application services expose create/query only.
- No normal application service exposes update/delete audit operations.
- Direct database access remains limited to migration/admin recovery procedures.

### Acceptance Checks

- Override without reason fails.
- Approved override writes actor, entity, old value, new value, reason, IP/user agent where available.
- Audit query is restricted to authorized roles.
- Tests assert audit rows for sample protected mutation.

### Suggested Steps

- [ ] Define audit input type.
- [ ] Implement required-reason helper.
- [ ] Implement audit repository create-only path.
- [ ] Integrate audit into a sample protected mutation.
- [ ] Implement restricted audit query service.
- [ ] Add tests for reason guard, audit create, and query permission.

## 14. Task E0.F3.T4: Lock Privacy, Consent, Retention, and Support-Access Policies

### Scope

Convert launch-sensitive privacy, consent, retention, and support-access decisions into documented defaults and enforceable configuration.

### Implementation Details

Create:

```text
packages/domain/src/security/privacy-policy.ts
packages/domain/src/security/communication-consent.ts
packages/domain/src/security/retention-policy.ts
packages/domain/src/security/support-access.ts
packages/domain/tests/security/communication-consent.test.ts
packages/domain/tests/security/support-access.test.ts
engineering-doc/privacy-consent-retention-policy.md
```

Policy defaults:

| Area | Default |
| --- | --- |
| Email/SMS consent | Respect explicit opt-out; transactional billing/operational messages require approved local policy before production. |
| Import files | Store securely and retain only as long as agreed for migration validation. |
| Communication logs | Store template, channel, recipient, status, related record, and body snapshot or approved summary. |
| Uploaded files | Private by default; signed URL or access-checked proxy downloads only. |
| Audit logs | Append-only and retained through the pilot. |
| Developer/support access | No production PII by default; time-boxed and reviewed if enabled. |
| Sensitive student notes | Separate sensitive detail from general learning notes and hide from parent/student/unrelated teacher. |

### Acceptance Checks

- Opt-out behavior is tested.
- Sensitive notes are hidden from unauthorized roles.
- Developer/support access is disabled or time-boxed in production config.
- Policy defaults are documented and referenced by communication, upload, notes, and launch readiness work.

### Suggested Steps

- [ ] Write policy doc.
- [ ] Add policy config modules.
- [ ] Add communication consent helper.
- [ ] Add support access helper.
- [ ] Add tests for consent and support access.
- [ ] Link policy doc from security and DevOps docs if needed.

## 15. Task E0.F4.T1: Configure Environments, Secrets, Health Checks, and CI/CD

### Scope

Prepare local, test, staging, and production environments with safe configuration, health checks, CI jobs, deployment expectations, and monorepo-aware build caching.

### Implementation Details

Create:

```text
packages/config/src/env/server.ts
packages/config/src/env/web.ts
apps/api/src/health/health.controller.ts
apps/api/src/health/health.service.ts
apps/web/src/app/api/health/route.ts
.github/workflows/ci.yml
engineering-doc/deployment-runbook.md
```

Environment matrix:

| Variable | Local | Test | Staging | Production |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Local database | Dedicated test DB | Staging DB | Production DB |
| `WEB_BASE_URL` | Localhost web | Test URL | Staging web URL | Production web URL |
| `API_BASE_URL` | Localhost API | Test API URL | Staging API URL | Production API URL |
| `AUTH_PROVIDER_SECRET` | Sandbox | Test fake/sandbox | Sandbox | Live |
| `PAYMENT_PROVIDER_SECRET` | Sandbox | Fake/sandbox | Sandbox | Live |
| `PAYMENT_WEBHOOK_SECRET` | Sandbox | Fake/sandbox | Sandbox | Live |
| `EMAIL_PROVIDER_SECRET` | Sandbox | Fake | Sandbox | Live |
| `SMS_PROVIDER_SECRET` | Sandbox | Fake | Sandbox | Live |
| `STORAGE_BUCKET` | Dev bucket | Test bucket | Staging bucket | Production bucket |
| `SENTRY_DSN` | Optional | Optional | Staging DSN | Production DSN |

Health endpoint rules:

- API `GET /health` confirms the NestJS app responds.
- API `GET /health/db` checks database reachability.
- API `GET /health/integrations` reports shallow adapter configuration status without revealing secrets.
- Web `GET /api/health` confirms the Next.js app responds and can read public runtime config.

CI minimum:

```text
install pnpm dependencies
verify lockfile
generate Prisma client
typecheck
lint
unit tests
integration tests if database service is available
Prisma validate
build all workspaces through Turbo
Playwright smoke tests
```

### Acceptance Checks

- Staging and production can be configured without code changes.
- CI passes on a clean checkout.
- Health endpoints return safe status without secrets.
- Deployment runbook defines deploy, migration, smoke, rollback, and hotfix expectations for both web and API apps.

### Suggested Steps

- [ ] Define server and web environment schemas.
- [ ] Update `.env.example`.
- [ ] Add API and web health endpoints.
- [ ] Add CI workflow with pnpm and Turbo cache.
- [ ] Add deployment runbook.
- [ ] Run CI commands locally where possible.

## 16. Task E0.F4.T2: Add Structured Logging, Monitoring, and Job-Run Observability

### Scope

Make request failures, provider failures, and scheduled job failures visible without leaking secrets or sensitive student data.

### Implementation Details

Create:

```text
apps/api/src/common/logging/logger.ts
apps/api/src/common/logging/redact.ts
apps/api/src/common/interceptors/request-logging.interceptor.ts
apps/api/src/common/monitoring/error-monitoring.ts
apps/api/src/jobs/job-runs.service.ts
apps/api/src/jobs/job-run.types.ts
apps/api/tests/unit/logging/redact.test.ts
apps/api/tests/integration/jobs/job-runs.test.ts
engineering-doc/job-failure-runbook.md
```

Structured log fields:

```text
timestamp
level
environment
requestId
actorUserId
roles
endpointOrAction
entityType
entityId
errorCode
provider
providerReference
jobName
jobRunId
```

Redaction rules:

- Never log passwords, auth tokens, payment card data, raw provider secrets, or full sensitive student notes.
- For communication bodies, log template code and message ID; body logging follows approved privacy policy.
- For files, log storage key only if it does not expose student/family names.

`job_runs` helper behavior:

- `startJobRun(jobName, metadata)` creates a running row.
- `completeJobRun(jobRunId, result)` marks success.
- `failJobRun(jobRunId, error)` marks failure and sends monitoring event.
- Repeated failure handling must not create duplicate domain effects.

### Acceptance Checks

- Synthetic failed job creates a failed `job_runs` row.
- Synthetic failed job sends monitoring event.
- Logs do not include secrets or sensitive notes.
- Job failure runbook explains lookup, triage, retry, and escalation.

### Suggested Steps

- [ ] Add logger and redaction helper.
- [ ] Add monitoring wrapper.
- [ ] Add request logging interceptor.
- [ ] Add job run helper.
- [ ] Add synthetic failed-job test route or test-only job.
- [ ] Add unit tests for redaction.
- [ ] Add integration tests for job run lifecycle.
- [ ] Write job failure runbook.

## 17. Task E0.F4.T3: Define Provider Adapter Interfaces and Sandbox Smoke Tests

### Scope

Ensure domain services depend on internal adapter interfaces instead of provider SDKs directly.

### Implementation Details

Create:

```text
packages/integrations/src/payment/payment-adapter.ts
packages/integrations/src/payment/fake-payment-adapter.ts
packages/integrations/src/email/email-adapter.ts
packages/integrations/src/email/fake-email-adapter.ts
packages/integrations/src/sms/sms-adapter.ts
packages/integrations/src/sms/fake-sms-adapter.ts
packages/integrations/src/storage/storage-adapter.ts
packages/integrations/src/storage/fake-storage-adapter.ts
packages/integrations/src/provider-registry.ts
packages/integrations/tests/fake-adapters.test.ts
engineering-doc/provider-smoke-test-checklist.md
```

Payment adapter interface:

```ts
export type CreatePaymentSessionInput = {
  invoiceId: string;
  amountMinor: number;
  currency: "AUD";
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
};

export type PaymentAdapter = {
  createPaymentSession(input: CreatePaymentSessionInput): Promise<{
    provider: string;
    providerSessionId: string;
    url: string;
  }>;
  verifyWebhookSignature(rawBody: string, signature: string): Promise<boolean>;
};
```

Email/SMS adapter behavior:

- Return provider message ID.
- Return retryable/non-retryable failure classification.
- Never decide business eligibility; communication services decide whether a message should send.

Storage adapter behavior:

- Create signed upload URL.
- Create signed download URL.
- Delete or mark object for cleanup where supported.
- Never allow public-by-default submission files.

Smoke checklist must cover:

- Auth provider sandbox login.
- Payment session creation.
- Payment webhook signature verification.
- Email sandbox send.
- SMS sandbox send.
- Signed upload/download.
- Monitoring test event.

### Acceptance Checks

- Fake adapters make automated tests deterministic.
- API services import adapter interfaces, not provider SDKs.
- Sandbox smoke checklist exists for staging.
- Provider secrets are read only from environment configuration.

### Suggested Steps

- [ ] Define adapter interfaces.
- [ ] Implement fake adapters.
- [ ] Add provider registry.
- [ ] Add adapter unit tests.
- [ ] Write sandbox smoke checklist.
- [ ] Confirm no domain service imports provider SDK directly.

## 18. Task E0.F5.T1: Establish Automated Checks and Baseline Test Harness

### Scope

Make lint, typecheck, tests, build, Prisma validation, and E2E smoke commands reliable across the monorepo from the first implementation slice.

### Implementation Details

Create:

```text
vitest.workspace.ts
playwright.config.ts
apps/api/tests/unit/example.test.ts
apps/api/tests/integration/example.test.ts
apps/api/tests/e2e/auth-boundary.e2e-spec.ts
apps/web/tests/unit/example.test.ts
apps/web/tests/e2e/role-shells.spec.ts
packages/test-utils/src/actors.ts
packages/test-utils/src/database.ts
engineering-doc/developer-setup.md
```

Testing conventions:

- Unit tests run without network or database access.
- Integration tests may use PostgreSQL but must enforce test database safety checks.
- API E2E tests boot NestJS with fake providers where possible.
- Web E2E tests verify route shells and critical flows through Playwright.
- Shared packages keep tests close to package code or in package-level `tests` directories.

### Acceptance Checks

- `pnpm typecheck` passes.
- `pnpm lint` passes.
- `pnpm test:unit` passes.
- `pnpm db:validate` passes.
- `pnpm build` passes.
- E2E smoke tests can render role shell pages and API health endpoints.

### Suggested Steps

- [ ] Add Vitest workspace config.
- [ ] Add Playwright config.
- [ ] Add fixture conventions.
- [ ] Add API and web sample tests.
- [ ] Add integration database safety helper.
- [ ] Document verification commands in `engineering-doc/developer-setup.md`.

## 19. E0 Completion Checklist

`E0` is complete only when all checks below are true:

- [ ] pnpm workspace and Turborepo pipeline exist.
- [ ] Root `pnpm build`, `pnpm lint`, `pnpm typecheck`, and `pnpm test` run through Turbo.
- [ ] Next.js App Router web app builds from `apps/web`.
- [ ] NestJS API app builds from `apps/api`.
- [ ] Tailwind CSS is configured for web and shared UI package usage.
- [ ] Role route groups and placeholder web pages exist.
- [ ] API health endpoints exist and return safe status.
- [ ] Shared contracts, domain, UI, db, integrations, config, and test-utils packages exist.
- [ ] API response, domain error, validation, date, and money primitives are tested.
- [ ] Prisma runtime config, client generation, migration, and seed flow work from `packages/db`.
- [ ] Initial seed includes stable handles for owner, admin, academic lead, teacher, billing admin, parent, student, family, class, fee plan, and concept.
- [ ] SQL-only constraints reject high-risk duplicate states.
- [ ] Polymorphic reference contracts protect attachments, communication logs, and alert tasks.
- [ ] Managed auth resolves internal users and blocks disabled users.
- [ ] RBAC and ownership checks cover parent, student, teacher, billing, and academic boundaries.
- [ ] Audit service is append-only for normal application use.
- [ ] Privacy, consent, retention, and support-access policies are documented and represented in config.
- [ ] Environment matrix and `.env.example` exist.
- [ ] CI runs monorepo verification commands with pnpm and Turbo.
- [ ] Structured logging, monitoring wrapper, and `job_runs` helper exist.
- [ ] Provider adapter interfaces and fake adapters exist.
- [ ] Staging sandbox smoke checklist exists.
