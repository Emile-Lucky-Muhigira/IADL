# Changelog

All notable changes to this project are documented here. The format is based on
[Keep a Changelog](https://keepachangelog.com/) and the project follows
semantic versioning.

## [Unreleased]

### Security
- Enforced tenant isolation at the service layer across all modules (courses,
  sessions, enrollments, attendance, assessments, certificates, users,
  analytics, finance, messages). Added `common/utils/tenant.util.ts` with
  `assertSameTenant` and `assertCanAccessStudent` helpers.
- Added missing `@Roles` guards to previously unprotected endpoints
  (`GET/PATCH /users/:id`, `/users/:parentId/children`,
  `/enrollments/student/:userId`, `/attendance/student/:userId`,
  `/certificates/student/:userId`, `/analytics/student/:userId`).
- Fixed `notifications.markRead` ignoring the owning user (any user could mark
  another user's notifications as read).
- Restricted messaging so non-global users can only message recipients within
  their own school.

### Added
- Expanded database seed with two tenants (Nairobi & Mombasa), multiple
  students, courses, sessions, attendance history, assessments & submissions,
  finance ledger entries, a certificate, notifications, and messages.
- Project documentation: `README.md`, `SECURITY.md`, `CONTRIBUTING.md`,
  per-app READMEs, and `docs/` (architecture, API, deployment).

### Changed
- Prisma migrations are now committed (required for `prisma migrate deploy`).

## [1.0.0] - 2026-06-03

### Added
- Initial multi-tenant EMIS: NestJS API, Next.js web client, Prisma schema,
  8-role RBAC, and the core academic, attendance, finance, and certificate
  modules.
