#!/usr/bin/env bash
# Деплой ПРОМО·ФАКТ на Vercel (проект promodrom).
# Используется ТОЛЬКО для ручного прод-деплоя. Обычно деплой идёт
# автоматически при push в main (Git-интеграция в Vercel Dashboard).
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ проверка линковки с проектом Vercel…"
vercel ls >/dev/null 2>&1 || vercel link --yes

echo "→ сборка (читает PERFLUENCE_WIDGET_URL из Vercel env)…"
npm run build

echo "→ проверка, что /store и /category сгенерированы…"
npm run build:check

echo "→ прод-деплой…"
vercel deploy --prebuilt --prod --yes

echo "deploy ok: $(date)"
