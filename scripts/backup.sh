#!/usr/bin/env bash
set -euo pipefail

# Nightly Postgres backup. Dumps from INSIDE the db container (Trap #6),
# writes a timestamped, gzipped file to an external drive, then prunes old ones.

BACKUP_DIR="${BACKUP_DIR:-/mnt/backup/erp}"     # external USB / NAS mount
KEEP_DAYS="${KEEP_DAYS:-14}"
COMPOSE="docker compose -f docker-compose.prod.yml"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT="${BACKUP_DIR}/erp-${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"
echo "Backing up to ${OUT}"
$COMPOSE exec -T db pg_dump -U erp -d erp | gzip -c > "$OUT"

echo "Pruning backups older than ${KEEP_DAYS} days"
find "$BACKUP_DIR" -name 'erp-*.sql.gz' -mtime +"$KEEP_DAYS" -delete

echo "Backup complete: ${OUT}"