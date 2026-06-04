<div align="center">

# IADL Center EMIS

**Education Management Information System for IADL Center (Angaza) and its ADL Schools**

A secure, multi-tenant platform for managing schools, learners, courses, attendance, finance, and certification across the ADL network.

[![CI](https://github.com/angaza/iadl-emis/actions/workflows/ci.yml/badge.svg)](.github/workflows/ci.yml)
[![Security](https://github.com/angaza/iadl-emis/actions/workflows/security.yml/badge.svg)](.github/workflows/security.yml)

</div>

---

## Overview

IADL Center EMIS is a monorepo containing a NestJS API and a Next.js web client backed by a shared multi-tenant PostgreSQL database. Every school is a **tenant**; data is strictly isolated per tenant, and access is governed by an 8-role RBAC hierarchy.

| Layer | Stack | Port |
|---|---|---|
| **API** | NestJS · TypeScript · Prisma · PostgreSQL · Redis | `3001` |
| **Web** | Next.js 14 (App Router) · TypeScript · Tailwind · React Query | `3000` |
| **Shared** | TypeScript types & enums (`packages/shared`) | — |

## Features

- **Multi-tenancy** — strict per-school data isolation enforced at the service layer (see [SECURITY.md](SECURITY.md)).
- **RBAC** — 8 roles: Super Admin, ADL Admin, School Gatekeeper, Trainer, Accountant, Parent, System Auditor, Student.
- **Academics & LMS** — courses, enrollments, sessions, assessments & grading.
- **Attendance** — student self check-in, manual & bulk marking, low-attendance alerts.
- **Finance** — running-balance ledger, invoices/payments, outstanding-balance tracking.
- **Certificates** — issuance on completion with public verification by code.
- **Communications** — in-app messaging and notifications.
- **Analytics** — global, branch, course and student dashboards.

## Quick Start

> Full instructions, troubleshooting, and Docker workflow live in **[SETUP.md](SETUP.md)**.

```bash
# 1. Install dependencies (npm workspaces)
npm install

# 2. Start infrastructure
docker compose up postgres redis -d

# 3. Configure env, migrate & seed sample data
cp .env.example .env
cd apps/api && cp ../../.env.example .env
npx prisma migrate dev && npx ts-node prisma/seed.ts && cd ../..

# 4. Run both apps
npm run dev
```

- Web app → http://localhost:3000
- API → http://localhost:3001/api/v1
- Swagger docs → http://localhost:3001/api/docs

### Test accounts (after seeding)

Admins use password `Admin@1234!`; everyone else uses `Pass@1234!`. The seed creates **two tenants** (Nairobi & Mombasa) so you can verify tenant isolation. See [SETUP.md](SETUP.md#test-accounts) for the full list.

| Role | Email |
|---|---|
| Super Admin | `superadmin@iadl.ac.ke` |
| ADL Admin | `admin@iadl.ac.ke` |
| Gatekeeper (Nairobi) | `gatekeeper@nairobi.adlschools.ac.ke` |
| Trainer (Nairobi) | `trainer@nairobi.adlschools.ac.ke` |
| Student (Nairobi) | `student@nairobi.adlschools.ac.ke` |
| Student (Mombasa) | `amina@mombasa.adlschools.ac.ke` |

## Repository layout

```
IADL/
├── apps/
│   ├── api/                 # NestJS REST API  → apps/api/README.md
│   └── web/                 # Next.js frontend → apps/web/README.md
├── packages/
│   └── shared/              # Shared types & enums
├── infra/                   # nginx, postgres config, deploy scripts
├── docs/                    # Architecture, API and deployment guides
├── .github/workflows/       # CI, deploy, security pipelines
├── docker-compose.yml       # Local dev infrastructure
└── docker-compose.prod.yml  # Production composition
```

## Documentation

| Document | Purpose |
|---|---|
| [SETUP.md](SETUP.md) | Local setup, Docker, troubleshooting |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System design, modules, data model, RBAC matrix |
| [docs/API.md](docs/API.md) | REST conventions & endpoint reference |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Environments, build & release process |
| [docs/ENGINEERING_GUIDE.md](docs/ENGINEERING_GUIDE.md) | Architecture rules & conventions for engineers |
| [SECURITY.md](SECURITY.md) | Tenant isolation, auth model, reporting |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Branching, commits, code standards |
| [CHANGELOG.md](CHANGELOG.md) | Notable changes |

## Common scripts

| Command | Description |
|---|---|
| `npm run dev` | Run API + web in watch mode (Turbo) |
| `npm run build` | Build all workspaces |
| `npm run test` | Run all tests |
| `npm run lint` | Lint all workspaces |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## License

Proprietary & confidential — © Angaza Center, 2026. See [LICENSE](LICENSE).
