#!/bin/bash
# IADL EMIS Production Deployment Script
# Usage: ./infra/scripts/deploy.sh [--migrate] [--seed]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }
error() { echo "[ERROR] $*" >&2; exit 1; }

cd "$ROOT_DIR"

[ -f ".env" ] || error ".env file not found. Copy .env.production.example to .env and fill in values."

log "Starting IADL EMIS deployment..."

# Run migrations if requested
if [[ "${1:-}" == "--migrate" || "${2:-}" == "--migrate" ]]; then
  log "Running database migrations..."
  docker compose -f docker-compose.prod.yml run --rm api npx prisma migrate deploy
  log "Migrations complete."
fi

# Seed if requested (only safe in non-prod or first-time setup)
if [[ "${1:-}" == "--seed" || "${2:-}" == "--seed" ]]; then
  log "Seeding database..."
  docker compose -f docker-compose.prod.yml run --rm api npx ts-node prisma/seed.ts
  log "Seed complete."
fi

# Pull latest images and start
log "Pulling images and starting services..."
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d

# Wait for health checks
log "Waiting for services to be healthy..."
sleep 15

API_HEALTH=$(docker inspect --format='{{.State.Health.Status}}' iadl_api 2>/dev/null || echo "unknown")
if [ "$API_HEALTH" != "healthy" ]; then
  log "API health: $API_HEALTH — checking logs..."
  docker logs iadl_api --tail 30
fi

log "Cleaning up old images..."
docker image prune -f

log "Deployment complete!"
log "API:  https://iadl.angazacenter.org/api/v1"
log "Web:  https://iadl.angazacenter.org"
log "Docs: https://iadl.angazacenter.org/api/docs (disabled in production)"
