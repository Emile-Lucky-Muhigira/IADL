# IADL Center EMIS — Setup Guide

## Prerequisites
- Node.js 20+
- Docker Desktop
- npm 10+

## Quick Start

### 1. Clone & Install
```bash
cd IADL
cp .env.example .env
npm install
```

### 2. Start Database & Redis
```bash
docker compose up postgres redis -d
```

### 3. Run Database Migrations & Seed
```bash
cd apps/api
cp .env.example .env          # fill in your DATABASE_URL
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### 4. Start Development Servers
```bash
# From root
npm run dev
```
- API: http://localhost:3001/api/v1
- Swagger Docs: http://localhost:3001/api/docs
- Web App: http://localhost:3000

### 5. Or Run Everything in Docker
```bash
docker compose up --build
```

---

## Test Accounts (after seeding)

| Role | Email | Password |
|---|---|---|
| Super Admin | superadmin@iadl.ac.ke | Admin@1234! |
| ADL Admin | admin@iadl.ac.ke | Admin@1234! |
| Gatekeeper | gatekeeper@nairobi.adlschools.ac.ke | Pass@1234! |
| Trainer | trainer@nairobi.adlschools.ac.ke | Pass@1234! |
| Student | student@nairobi.adlschools.ac.ke | Pass@1234! |
| Parent | parent@nairobi.adlschools.ac.ke | Pass@1234! |
| Accountant | finance@nairobi.adlschools.ac.ke | Pass@1234! |
| Auditor | auditor@nairobi.adlschools.ac.ke | Pass@1234! |

---

## Project Structure

```
IADL/
├── apps/
│   ├── api/               # NestJS REST API (port 3001)
│   │   ├── prisma/        # Schema + migrations + seed
│   │   └── src/
│   │       ├── modules/   # All 9 business modules
│   │       ├── common/    # Guards, decorators, filters
│   │       └── prisma/    # Database service
│   └── web/               # Next.js 14 frontend (port 3000)
│       └── src/
│           ├── app/       # App router pages (8 role dashboards)
│           ├── components/ # Shared UI components
│           └── lib/       # API client, auth config, utils
├── packages/
│   └── shared/            # Shared TypeScript types & enums
├── docker-compose.yml
└── .env.example
```

---

## API Endpoints Summary

| Module | Base Path |
|---|---|
| Auth | /api/v1/auth |
| Tenants | /api/v1/tenants |
| Users | /api/v1/users |
| Courses | /api/v1/courses |
| Enrollments | /api/v1/enrollments |
| Sessions | /api/v1/sessions |
| Attendance | /api/v1/attendance |
| Assessments | /api/v1/assessments |
| Finance | /api/v1/finance |
| Certificates | /api/v1/certificates |
| Notifications | /api/v1/notifications |
| Messages | /api/v1/messages |
| Analytics | /api/v1/analytics |

Full interactive docs at `/api/docs` (Swagger).

---

## Development Notes

- Branch naming: `feature/ANGAZA-[ticket-id]-description`
- DB migrations: never raw SQL — always `prisma migrate dev`
- Unit test coverage target: 80% minimum
- Multi-tenant enforcement: every request is scoped to the user's `tenantId`

---

## Known Environment Issues & Workarounds

### Port 5432 conflict (Postgres)
If you have a local Postgres instance already running on port 5432, Docker cannot bind to it.
The `docker-compose.yml` maps the container to **host port 5433** to avoid this conflict.
Your `DATABASE_URL` must therefore use port **5433**:
```
DATABASE_URL="postgresql://iadl_user:iadl_pass@localhost:5433/iadl_emis?schema=public"
```
Check your `.env` file — this is already set correctly.

### Postgres volume credential mismatch (clean start)
If you changed DB credentials after the Docker volume was already initialized, Postgres will
refuse connections with `P1010: User denied access`. Fix with a clean reset:
```bash
docker compose down -v        # destroys the volume — ALL data is wiped
docker compose up postgres redis -d
cd apps/api && npx prisma migrate dev --name init && npx ts-node prisma/seed.ts
```
Run this **once** on a fresh machine or after a credential change.

### OneDrive sync interference
The project is inside `OneDrive/Desktop/`. OneDrive can lock files during sync, causing:
- `.env` edits not saving in the editor
- `node_modules` sync errors (OneDrive tries to upload thousands of files)

**Recommendation:** Add the project to OneDrive's exclusion list, or move it outside OneDrive:
```powershell
# Move project out of OneDrive
Move-Item "C:\Users\emuhi\OneDrive\Desktop\IADL" "C:\Dev\IADL"
```
Then update your terminal paths accordingly.
