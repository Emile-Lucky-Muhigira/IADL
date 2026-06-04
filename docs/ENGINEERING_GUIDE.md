# IADL Center EMIS — Engineering Guide

## Project Summary
Multi-tenant Education Management Information System for IADL Center (Angaza) and its ADL Schools.
- **API:** NestJS + TypeScript + Prisma + PostgreSQL (port 3001)
- **Web:** Next.js 14 App Router + TypeScript + Tailwind (port 3000)
- **Shared:** `packages/shared` — TypeScript types & enums

## Key Architecture Rules

### Multi-Tenancy
- Every school is a `Tenant`. Users belong to one tenant (except SUPER_ADMIN and ADL_ADMIN who are global).
- All tenant-scoped queries **must** filter by `tenantId`. Tenant isolation is enforced at the service layer (see `apps/api/src/common/utils/tenant.util.ts`).
- Never expose data from one tenant to another.

### RBAC
8 roles in strict hierarchy — see `packages/shared/src/constants/roles.ts`:
`SUPER_ADMIN > ADL_ADMIN > SCHOOL_GATEKEEPER > TRAINER / ACCOUNTANT > PARENT > SYSTEM_AUDITOR > STUDENT`
- Use `@Roles(UserRole.X)` decorator + `RolesGuard` on every protected endpoint.
- `SYSTEM_AUDITOR` is read-only everywhere — never add write access.

### Database
- Schema is in `apps/api/prisma/schema.prisma`.
- Never write raw SQL migrations — always use `npx prisma migrate dev --name <name>`.
- Schema changes must use the Expand & Contract pattern for zero-downtime.
- Flake IDs (cuid) for primary keys.

### API Standards
- REST over HTTPS, JSON payloads.
- URI: `/api/v1/<resource>` — never change the `v1` prefix without versioning policy.
- All responses wrapped by `ResponseInterceptor`: `{ success: true, data: ... }`.
- Errors go through `HttpExceptionFilter`: `{ success: false, error: [...] }`.

### Frontend
- Role-based routing enforced by `apps/web/src/middleware.ts`.
- Each role has its own dashboard subtree under `app/dashboard/<role>/`.
- API calls go through `apps/web/src/lib/api.ts` — never call the API directly.
- Use React Query for all data fetching. Invalidate queries on mutations.

## Running Locally

```bash
# 1. Start infra
docker compose up postgres redis -d

# 2. Migrate + seed
cd apps/api && npx prisma migrate dev && npx ts-node prisma/seed.ts && cd ../..

# 3. Start both apps
npm run dev
```

## Git Workflow
- Branches: `feature/ANGAZA-[ticket-id]-description`
- Merges to `develop` require 2 senior engineer approvals + green CI
- Never commit `.env` files

## Test Accounts (after seed)
| Email | Password | Role |
|---|---|---|
| superadmin@iadl.ac.ke | Admin@1234! | Super Admin |
| admin@iadl.ac.ke | Admin@1234! | ADL Admin |
| gatekeeper@nairobi.adlschools.ac.ke | Pass@1234! | Gatekeeper |
| trainer@nairobi.adlschools.ac.ke | Pass@1234! | Trainer |
| student@nairobi.adlschools.ac.ke | Pass@1234! | Student |
| parent@nairobi.adlschools.ac.ke | Pass@1234! | Parent |
| finance@nairobi.adlschools.ac.ke | Pass@1234! | Accountant |
| auditor@nairobi.adlschools.ac.ke | Pass@1234! | Auditor |
