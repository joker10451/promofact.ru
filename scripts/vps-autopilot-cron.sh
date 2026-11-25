#!/usr/bin/env bash
set -euo pipefail

LOG_FILE="/tmp/promofact-autopilot.log"
if [ -f "$LOG_FILE" ] && [ "$(wc -c < "$LOG_FILE")" -gt 524288 ]; then
  tail -n 200 "$LOG_FILE" > "${LOG_FILE}.tmp" && mv "${LOG_FILE}.tmp" "$LOG_FILE"
fi

set -a
[ -f /etc/promofact.env ] && . /etc/promofact.env
[ -f /srv/promofact/.env.production.local ] && . /srv/promofact/.env.production.local
set +a

SECRET="${TELEGRAM_POSTING_SECRET_DEPLOYED:-${TELEGRAM_POSTING_SECRET:-${CRON_SECRET:-}}}"
if [ -z "$SECRET" ]; then
  echo "[$(date -Is)] ERROR: no posting secret configured"
  exit 1
fi

RESP=$(curl -fsS -m 120 -X POST \
  -H "Host: promofact.ru" \
  -H "X-Forwarded-Proto: https" \
  -H "Authorization: Bearer ${SECRET}" \
  "http://127.0.0.1:3000/api/perfluence-live/autopilot")

echo "[$(date -Is)] $RESP"
