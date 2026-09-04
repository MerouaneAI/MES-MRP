#!/usr/bin/env bash
set -euo pipefail

# Restore a gzipped dump. By default restores into a SCRATCH database so you can
# safely rehearse. Pass a second arg to target a different db name.
# Usage: ./scripts/restore.sh /mnt/backup/erp/erp-20260903-020000.sql.gz [target_db]

FILE="${1:?Usage: restore.sh <dump.sql.gz> [target_db]}"
TARGET_DB="${2:-erp_restore_test}"
COMPOSE="docker compose -f docker-compose.prod.yml"

echo "Recreating scratch database ${TARGET_DB}"
$COMPOSE exec -T db psql -U erp -d postgres -c "DROP DATABASE IF EXISTS ${TARGET_DB};"
$COMPOSE exec -T db psql -U erp -d postgres -c "CREATE DATABASE ${TARGET_DB};"

echo "Restoring ${FILE} into ${TARGET_DB}"
gunzip -c "$FILE" | $COMPOSE exec -T db psql -U erp -d "${TARGET_DB}"

echo "Done. Verify with: ${COMPOSE} exec db psql -U erp -d ${TARGET_DB} -c '\\dt'"