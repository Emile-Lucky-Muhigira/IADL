# Contributing

Thanks for contributing to IADL Center EMIS. This guide covers the workflow and
standards expected for all changes.

## Prerequisites

- Node.js 20+, npm 10+
- Docker Desktop (Postgres + Redis)

See [SETUP.md](SETUP.md) to get a working environment.

## Branching strategy (Gitflow)

- `main` — production releases only.
- `develop` — integration branch for features.
- Feature branches: `feature/ANGAZA-<ticket-id>-short-description`
  (e.g. `feature/ANGAZA-142-attendance-alerts`).
- Hotfixes: `hotfix/ANGAZA-<ticket-id>-description`.

Merges into `develop` require a green CI pipeline and approval from at least two
senior engineers.

## Commits & pull requests

- Write clear, imperative commit messages ("Add low-attendance alert job").
- Keep PRs focused and small where possible.
- Every PR must:
  - Pass `npm run lint`, `npm run build`, and `npm run test`.
  - Include/maintain unit tests (target **80%** line coverage).
  - Update documentation when behavior or APIs change.

## Code standards

- **TypeScript** throughout; no implicit `any` in new code where avoidable.
- Keep cyclomatic complexity under 10 per function.
- **API:** every protected endpoint declares `@Roles(...)`; every tenant-scoped
  service method enforces tenant isolation (see [SECURITY.md](SECURITY.md)).
- **Web:** all data fetching goes through React Query and `apps/web/src/lib/api.ts`;
  never call the API directly. Invalidate queries after mutations.
- Follow the existing module structure (`controller` → `service` → Prisma).

## Database changes

- Never hand-write raw SQL migrations. Use:
  ```bash
  cd apps/api && npx prisma migrate dev --name <change-name>
  ```
- Migrations are committed to source control (required for production deploys).
- Schema changes affecting live instances must follow the **Expand & Contract**
  pattern for zero-downtime.

## Running checks locally

```bash
npm run lint            # ESLint across workspaces
npm run build           # Type-check & build
npm run test            # Unit tests
cd apps/api && npx jest --coverage   # Coverage report
```
