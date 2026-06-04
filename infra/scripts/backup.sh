#!/bin/bash
# Automated database backup script — run via cron daily
# Add to crontab: 0 2 * * * /opt/iadl-emis/infra/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="/opt/iadl-emis/backups"
DATE=$(date '+%Y%m%d_%H%M%S')
BACKUP_FILE="$BACKUP_DIR/iadl_emis_$DATE.sql.gz"
RETAIN_DAYS=30

mkdir -p "$BACKUP_DIR"

source /opt/iadl-emis/.env

echo "[$DATE] Starting database backup..."

docker exec iadl_postgres pg_dump \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  --no-password \
| gzip > "$BACKUP_FILE"

echo "Backup saved: $BACKUP_FILE ($(du -sh "$BACKUP_FILE" | cut -f1))"

# Retain only last N days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +"$RETAIN_DAYS" -delete
echo "Old backups cleaned up. Retained last $RETAIN_DAYS days."

# Optionally upload to S3
if [ -n "${AWS_S3_BUCKET:-}" ]; then
  aws s3 cp "$BACKUP_FILE" "s3://$AWS_S3_BUCKET/backups/$(basename "$BACKUP_FILE")"
  echo "Backup uploaded to S3."
fi
