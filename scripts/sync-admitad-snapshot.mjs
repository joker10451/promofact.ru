#!/usr/bin/env node

/**
 * scripts/sync-admitad-snapshot.mjs
 *
 * Скрипт безопасной синхронизации снимка Admitad (ADMITAD-2 Safe Autopilot).
 * Запускается вручную разработчиком или по расписанию GitHub Actions.
 *
 * Запуск:
 *   node --loader ./scripts/ts-loader.mjs scripts/sync-admitad-snapshot.mjs
 *   npm run admitad:sync
 */

import fs from "node:fs";
import path from "node:path";

// Загрузка локальных env без вывода секретов
const envPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  const content = fs.readFileSync(envPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

async function main() {
  console.log("================================================================================");
  console.log("🚀 ЗАПУСК СИНХРОНИЗАЦИИ ADMITAD PUBLISHER API (ADMITAD-2 SAFE AUTOPILOT)");
  console.log("================================================================================");

  const { runAdmitadSafeSync } = await import("../src/lib/admitadSyncWorker.ts");

  const result = await runAdmitadSafeSync();

  if (!result.success) {
    console.error(`\n🚨 Синхронизация завершилась со статусом [${result.status}]: ${result.error || "Неизвестная ошибка"}`);
    process.exit(1);
  }

  const ag = result.aggregates;
  console.log("\n================================================================================");
  console.log("📊 СВОДНЫЕ АГРЕГАТЫ СИНХРОНИЗАЦИИ");
  console.log("================================================================================");
  console.log(`Sync Run ID:              ${ag.sync_run_id}`);
  console.log(`API campaigns total:      ${ag.campaigns_total}`);
  console.log(`API coupons total:        ${ag.coupons_total}`);
  console.log(`Normalized valid:         ${ag.normalized}`);
  console.log(`Quality gate pass:        ${ag.quality_pass}`);
  console.log(`Canonical mapped:         ${ag.mapped}`);
  console.log(`Legal/ERID ready:         ${ag.legal_ready}`);
  console.log(`Publishable (approved):   ${ag.publishable}`);
  console.log(`Ready (not approved):     ${ag.ready_not_approved}`);
  console.log(`Quarantined:              ${ag.quarantined}`);
  console.log(`DB records written:       ${ag.written}`);
  console.log(`Stale deactivated:        ${ag.deactivated}`);
  console.log(`Duration:                 ${ag.duration_ms} ms`);
  console.log("================================================================================\n");

  console.log("🎉 СИНХРОНИЗАЦИЯ УСПЕШНО ЗАВЕРШЕНА! Last-known-good snapshot обновлён.");
  process.exit(0);
}

main().catch((err) => {
  console.error("🚨 Фатальная ошибка скрипта синхронизации:", err);
  process.exit(1);
});
