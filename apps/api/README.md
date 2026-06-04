# @iadl/api

NestJS REST API for IADL Center EMIS. Multi-tenant, RBAC-protected, backed by
Prisma + PostgreSQL and Redis.

Runs on **port 3001** under the `/api/v1` prefix.

## Scripts

| Command | Description |
|---|---|
| `npm run start:dev` | Watch mode (Nest) |
| `npm run build` | Compile to `dist/` |
| `npm run start` | Run compiled server (`node dist/main`) |
| `npm run lint` | ESLint |
| `npm run test` | Unit tests (Jest) |
| `npm run db:migrate` | `prisma migrate dev` |
| `npm run db:generate` | Regenerate Prisma client |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |

## Layout

```
src/
├── main.ts                 # Bootstrap: helmet, CORS, validation, Swagger
├── app.module.ts           # Module wiring + audit middleware
├── common/
│   ├── decorators/         # @Roles, @CurrentUser, @Public
│   ├── guards/             # JwtAuth, Roles, Tenant
│   ├── filters/            # HttpExceptionFilter
│   ├── interceptors/       # ResponseInterceptor
│   ├── middleware/         # AuditMiddleware
│   ├── enums/              # UserRole
│   └── utils/tenant.util.ts# Tenant isolation helpers
├── modules/                # auth, tenants, users, courses, enrollments,
│                           # sessions, attendance, assessments, finance,
│                           # certificates, notifications, messages, analytics, health
└── prisma/                 # PrismaService
prisma/
├── schema.prisma           # Data model
├── migrations/             # Committed migrations
└── seed.ts                 # Sample data seeder
```

## Conventions

- Protect every endpoint with `@Roles(...)`; `SYSTEM_AUDITOR` is read-only.
- Enforce tenant scope in services with `common/utils/tenant.util.ts`
  (`assertSameTenant`, `assertCanAccessStudent`). See [../../SECURITY.md](../../SECURITY.md).
- Responses are wrapped by `ResponseInterceptor`; errors by `HttpExceptionFilter`.
- Swagger docs at `/api/docs` (non-production).

## Environment

Requires a `.env` (copy from the repo root `.env.example`). Key vars:
`DATABASE_URL`, `REDIS_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `WEB_URL`,
`API_PORT`, `NODE_ENV`.
