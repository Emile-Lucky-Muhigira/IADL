# Security

Security is a first-class requirement of IADL Center EMIS. The platform handles
student records, financial ledgers, and multi-school data that must never leak
across tenant boundaries.

## Reporting a vulnerability

Do **not** open a public GitHub issue for security problems. Email
**security@angazacenter.org** with details and reproduction steps. You will
receive an acknowledgement within 2 business days.

## Authentication

- Stateless **JWT** bearer tokens issued on login (`/api/v1/auth/login`).
- Passwords hashed with **bcrypt** (cost factor 12). Plaintext passwords are
  never stored or logged.
- The `JwtStrategy` re-loads the user on every request and rejects inactive
  accounts, so deactivating a user revokes access immediately.
- All routes are protected by a global `JwtAuthGuard`; public routes opt out
  explicitly via the `@Public()` decorator (e.g. login, certificate
  verification).

## Authorization (RBAC)

- 8 roles in a strict hierarchy (`packages/shared/src/constants/roles.ts`).
- Endpoints declare required roles with `@Roles(...)`, enforced by the global
  `RolesGuard`.
- `SYSTEM_AUDITOR` is **read-only everywhere** — never grant it write access.

## Multi-tenant isolation

This is the platform's most important control. Every school is a tenant; a user
(other than the global `SUPER_ADMIN` / `ADL_ADMIN` roles) may only access data
within their own `tenantId`.

Isolation is enforced at the **service layer** via helpers in
`apps/api/src/common/utils/tenant.util.ts`:

| Helper | Use |
|---|---|
| `isGlobalRole(role)` | True for `SUPER_ADMIN` / `ADL_ADMIN` (cross-tenant). |
| `assertSameTenant(resourceTenantId, user)` | Blocks access to a resource outside the caller's tenant. |
| `assertCanAccessStudent(prisma, studentId, actor)` | Allows a global admin, the student themselves, a **linked** parent, or same-tenant staff to read a student's records. |

**Rule of thumb:** any service method that fetches or mutates a tenant-scoped
resource by id must validate the resource's tenant against the authenticated
caller before returning or writing. Do not rely on the request body or query
params to carry the tenant — derive it from the persisted resource.

## Data protection

- Financial ledger entries are append-only (running balance per entry).
- Transport security (TLS 1.3) and at-rest encryption (KMS/AES-256) are handled
  at the infrastructure layer in production (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).
- Secrets (`JWT_SECRET`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY`, database and
  third-party credentials) are supplied via environment variables and **must
  never be committed**. `.gitignore` excludes all `*.env` files except the
  `.example` templates.

## Pre-deployment checklist

- [ ] Rotate `JWT_SECRET`, `NEXTAUTH_SECRET`, `ENCRYPTION_KEY` to strong random values.
- [ ] Set real database / Redis / AWS / M-Pesa / Africa's Talking credentials via env.
- [ ] Confirm `NODE_ENV=production` (disables Swagger, verbose logging).
- [ ] Verify CORS `WEB_URL` points at the production web origin.
- [ ] Run `npm run test` and the security workflow green.
