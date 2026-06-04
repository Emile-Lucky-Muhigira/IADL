# Architecture

## High-level

IADL Center EMIS is a layered, multi-tenant system:

1. **Core Identity & Records** — `Tenant` (school) and `User` are the foundation;
   every other entity references them.
2. **Functional modules** — Academics/LMS, Operations/Attendance, and
   Finance/Payments run day-to-day school operations.
3. **Output layer** — Notifications, Messaging, and Analytics aggregate events
   and data across all modules.

```
┌─────────────────────────────────────────────┐
│  Web (Next.js, role dashboards)  :3000        │
└───────────────┬───────────────────────────────┘
                │ HTTPS / JSON (Bearer JWT)
┌───────────────▼───────────────────────────────┐
│  API (NestJS)  :3001  /api/v1                  │
│  Guards: JwtAuth → Roles → (tenant checks)     │
│  Modules: auth, tenants, users, courses,       │
│  enrollments, sessions, attendance,            │
│  assessments, finance, certificates,           │
│  notifications, messages, analytics, health    │
└───────────────┬───────────────────────────────┘
                │ Prisma
┌───────────────▼───────────────────────────────┐
│  PostgreSQL          Redis (queues/cache)      │
└─────────────────────────────────────────────────┘
```

## Tech stack

| Concern | Choice |
|---|---|
| API framework | NestJS 10 (Express) |
| ORM | Prisma 5 (PostgreSQL) |
| Auth | Passport JWT + bcrypt |
| Queue/cache | Bull + Redis |
| Web | Next.js 14 App Router, React Query, Tailwind, Radix UI |
| Web auth | NextAuth (credentials) |
| Docs | Swagger / OpenAPI at `/api/docs` |
| Monorepo | npm workspaces + Turborepo |

## Data model (Prisma)

Primary keys are cuid strings. Key relationships:

- **Tenant 1—M User** (`User.tenantId`; null for global admins).
- **User M—M Course** resolved by **Enrollment** (`@@unique([userId, courseId])`).
- **Course 1—M Session / Assessment**.
- **Session 1—M AttendanceRecord** (`@@unique([userId, sessionId])`).
- **Assessment 1—M AssessmentSubmission** (`@@unique([assessmentId, studentId])`).
- **User/Tenant 1—M LedgerEntry** (append-only, running `balance`, unique `reference`).
- **Certificate** per `@@unique([userId, courseId])`, public `uniqueCode`.
- **ParentStudent** join table links parents to students.
- **Message → MessageRecipient** fan-out; **Notification** per user.
- **AuditLog** records mutations via `AuditMiddleware`.

Full schema: `apps/api/prisma/schema.prisma`.

## RBAC permission matrix

`SUPER_ADMIN > ADL_ADMIN > SCHOOL_GATEKEEPER > TRAINER / ACCOUNTANT > PARENT > SYSTEM_AUDITOR > STUDENT`

| Module | Super Admin | ADL Admin | Gatekeeper | Trainer | Student | Parent | Accountant | Auditor |
|---|---|---|---|---|---|---|---|---|
| Global Settings | CRUD | — | — | — | — | — | — | Read |
| School Onboarding | CRUD | CRUD | Read | — | — | — | — | Read |
| User Management | CRUD | CRUD | CRUD (branch) | — | — | — | — | Read |
| Course & LMS | CRUD | CRUD | Read | CRUD | Read | — | — | Read |
| Attendance | Read | Read | Read | CRUD | Trigger | Read | — | Read |
| Financial Ledger | Read | Read | Read | — | — | Read | CRUD | Read |
| Certificates | CRUD | CRUD | Read | — | Read | — | — | Read |
| Communications | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | — |

`SYSTEM_AUDITOR` is read-only everywhere. Global roles (`SUPER_ADMIN`,
`ADL_ADMIN`) operate across all tenants; all other roles are tenant-scoped.

## Multi-tenancy

See [../SECURITY.md](../SECURITY.md). Isolation is enforced in services using
`tenant.util.ts`. Resources derive their tenant from the persisted record, not
from request input.

## Request lifecycle

1. `JwtAuthGuard` (global) validates the bearer token and loads the user.
2. `RolesGuard` (global) checks `@Roles(...)` metadata.
3. Controller injects the user via `@CurrentUser()` and delegates to a service.
4. The service enforces tenant/ownership scope, then reads/writes via Prisma.
5. `ResponseInterceptor` wraps success as `{ success: true, data }`;
   `HttpExceptionFilter` wraps errors as `{ success: false, error }`.
