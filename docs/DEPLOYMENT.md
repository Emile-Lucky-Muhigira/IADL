# Deployment

## Environments

| Env | Purpose | Target | Data |
|---|---|---|---|
| `dev` | Local sandbox | Docker Compose | Seed/mock data |
| `qa` | QA validation | ECS Fargate (small) | Anonymised snapshots |
| `uat` | User acceptance | ECS Fargate (mirrors prod) | Masked staging |
| `prod` | Live | Multi-AZ Aurora PostgreSQL | Full isolation |

## Build artifacts

```bash
npm run build          # builds API (nest) and web (next)
```

- API output: `apps/api/dist` (run with `node dist/main`).
- Web output: `apps/web/.next` (run with `next start`).

Container images are built from `apps/api/Dockerfile` and `apps/web/Dockerfile`
(referenced by `docker-compose.prod.yml`).

## Environment variables

Copy `.env.production.example` and provide real values via your secrets manager.
**Never commit real secrets.** Required for production:

- `DATABASE_URL` — Postgres/Aurora connection string.
- `REDIS_URL` — Redis connection string.
- `JWT_SECRET`, `JWT_EXPIRES_IN` — token signing.
- `NEXTAUTH_URL`, `NEXTAUTH_SECRET` — web auth.
- `WEB_URL` — allowed CORS origin for the API.
- `NEXT_PUBLIC_API_URL` — API base URL the browser calls.
- `ENCRYPTION_KEY` — 32-char key for at-rest encryption helpers.
- `NODE_ENV=production` — disables Swagger and verbose logging.
- AWS / M-Pesa / Africa's Talking credentials (when those integrations are enabled).

> In containerized deployments the API must reach Postgres/Redis by **service
> name** (e.g. `postgres:5432`), not `localhost`. Local host-based dev uses
> host port `5433` (see [../SETUP.md](../SETUP.md)).

## Database migrations

Migrations are committed to the repo. In CI/CD and production, apply them with:

```bash
cd apps/api && npx prisma migrate deploy
```

Do **not** run `prisma migrate dev` against production. Follow the
Expand & Contract pattern for zero-downtime schema changes.

## Release process

1. Merge to `develop` → CI runs lint, build, tests, security scan.
2. Promote `develop` → `main` for a release (two senior approvals).
3. CI builds images and deploys using **Blue/Green**: new containers launch
   alongside the running version; traffic shifts via the load balancer only
   after health checks (`GET /api/v1/health`) pass.
4. Roll back by shifting traffic back to the previous (blue) target group.

## CI/CD

GitHub Actions workflows live in `.github/workflows/`:

- `ci.yml` — install, lint, build, test on PRs.
- `security.yml` — dependency/container vulnerability scanning.
- `deploy.yml` — build & deploy on release.

## Health & monitoring

- Liveness/readiness: `GET /api/v1/health`.
- Production observability (GuardDuty, Security Hub, metrics) is configured at
  the infrastructure layer; see `infra/`.
