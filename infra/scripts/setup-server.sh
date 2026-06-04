#!/bin/bash
# First-time server setup for IADL EMIS
# Run once on a fresh Ubuntu 22.04 server as root

set -euo pipefail

log() { echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"; }

log "Updating system packages..."
apt-get update && apt-get upgrade -y

log "Installing Docker..."
curl -fsSL https://get.docker.com | sh
usermod -aG docker ubuntu

log "Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="2.27.0"
curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
  -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

log "Creating app directory..."
mkdir -p /opt/iadl-emis
mkdir -p /opt/iadl-emis/infra/nginx/ssl

log "Setting up firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw --force enable

log "Installing Certbot for SSL..."
apt-get install -y certbot python3-certbot-nginx

log "Server setup complete."
log "Next steps:"
log "  1. Clone the repo to /opt/iadl-emis"
log "  2. Copy .env.production.example to /opt/iadl-emis/.env and fill in secrets"
log "  3. Run: certbot certonly --standalone -d iadl.angazacenter.org"
log "  4. Copy certs: cp /etc/letsencrypt/live/iadl.angazacenter.org/fullchain.pem infra/nginx/ssl/cert.pem"
log "  5. Run: ./infra/scripts/deploy.sh --migrate --seed"
