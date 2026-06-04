# API Reference

Base URL: `http://localhost:3001/api/v1` (dev). Interactive Swagger docs are
served at `/api/docs` when `NODE_ENV !== production`.

## Conventions

- **Protocol:** REST over HTTPS, JSON payloads.
- **Versioning:** all routes are prefixed `/api/v1`.
- **Auth:** send `Authorization: Bearer <token>` on every request except
  `@Public()` routes (login, certificate verification).
- **Success envelope:**
  ```json
  { "success": true, "data": <payload> }
  ```
- **Error envelope:**
  ```json
  { "success": false, "error": ["message"], "statusCode": 403, "path": "/api/v1/..." }
  ```
- **Pagination:** list endpoints accept `?page` & `?limit` and return
  `{ data, meta: { total, page, limit, totalPages } }`.

## Authentication

| Method | Path | Roles | Notes |
|---|---|---|---|
| POST | `/auth/login` | Public | `{ email, password }` → `{ accessToken, user }` |
| GET | `/auth/me` | Authenticated | Current user profile |
| POST | `/auth/change-password` | Authenticated | `{ currentPassword, newPassword }` |

## Resource endpoints (summary)

| Module | Base path | Representative endpoints |
|---|---|---|
| Tenants | `/tenants` | `POST /`, `GET /`, `GET /:id` |
| Users | `/users` | `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id`, `POST /:parentId/link-student/:studentId`, `GET /:parentId/children` |
| Courses | `/courses` | `POST /`, `GET /`, `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| Enrollments | `/enrollments` | `POST /`, `GET /my`, `GET /student/:userId`, `GET /course/:courseId`, `PATCH /:userId/course/:courseId/status` |
| Sessions | `/sessions` | `POST /`, `GET /branch`, `GET /course/:courseId`, `GET /:id`, `PATCH /:id`, `DELETE /:id` |
| Attendance | `/attendance` | `POST /trigger`, `POST /manual`, `POST /bulk`, `GET /session/:sessionId`, `GET /student/:userId`, `GET /stats/branch`, `GET /alerts/low` |
| Assessments | `/assessments` | `POST /`, `GET /course/:courseId`, `GET /:id`, `POST /:id/submit`, `POST /:id/grade/:studentId`, `GET /my-submissions` |
| Finance | `/finance` | `POST /entries`, `GET /summary`, `GET /ledger`, `GET /outstanding`, `GET /student/:userId` |
| Certificates | `/certificates` | `POST /issue`, `GET /verify/:code` (public), `GET /my`, `GET /student/:userId`, `GET /branch` |
| Notifications | `/notifications` | `GET /`, `PATCH /:id/read`, `PATCH /read-all` |
| Messages | `/messages` | `POST /`, `GET /inbox`, `GET /sent`, `PATCH /:messageId/read` |
| Analytics | `/analytics` | `GET /global`, `GET /branch`, `GET /course/:courseId`, `GET /student/:userId`, `GET /revenue-timeline` |
| Health | `/health` | `GET /` (liveness) |

> Authorization rules per endpoint are defined by `@Roles(...)` decorators in
> each controller and tenant scoping in the services. See
> [ARCHITECTURE.md](ARCHITECTURE.md#rbac-permission-matrix).

## Example

```bash
# Login
curl -s http://localhost:3001/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"trainer@nairobi.adlschools.ac.ke","password":"Pass@1234!"}'

# Use the returned accessToken
curl -s http://localhost:3001/api/v1/courses \
  -H "Authorization: Bearer <accessToken>"
```
