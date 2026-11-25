/**
 * scripts/sync-overdue-erids.mjs
 * Syncs 30-day pending_removal ERIDs from Perfluence into src/data/dynamic-overdue-erids.json
 * and automatically deletes corresponding old Telegram channel posts when token is present.
 */
import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const { runPerfluenceAutopilotCycle } = await import("../src/lib/perfluenceAutopilot.ts");
const { OVERDUE_PLACEMENT_ERIDS } = await import("../src/lib/overduePlacements.ts");

const DYNAMIC_PATH = path.resolve("src/data/dynamic-overdue-erids.json");

function readExistingDynamic() {
  try {
    const raw = JSON.parse(fs.readFileSync(DYNAMIC_PATH, "utf-8"));
    return Array.isArray(raw.erids) ? raw.erids : [];
  } catch {
    return [];
  }
}

async function main() {
  const report = await runPerfluenceAutopilotCycle({
    dryRun: false,
    enableTakeAvailable: false,
    enableActivateNewLandings: false,
    enableRepeatMissing: false,
    enableAutoReportSite: false,
    enablePendingRemovalSync: true,
    enableTelegramCleanup: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    maxRemovalInspect: 100,
    maxCatalogScan: 0,
  });

  if (report.sessionExpired) {
    console.warn("⚠ Сессия Perfluence истекла — список dynamic-overdue-erids.json оставлен без изменений.");
    return;
  }
  if (!report.sessionPresent) {
    console.log("ℹ️ Нет сессии Perfluence — пропуск sync-overdue-erids.");
    return;
  }

  const merged = new Set(readExistingDynamic());
  for (const erid of report.discoveredOverdueErids) {
    if (!OVERDUE_PLACEMENT_ERIDS.has(erid) && erid.length >= 6) {
      merged.add(erid);
    }
  }

  const nextList = [...merged].sort();
  const prevList = readExistingDynamic();
  if (JSON.stringify(nextList) !== JSON.stringify(prevList)) {
    fs.writeFileSync(
      DYNAMIC_PATH,
      JSON.stringify({ updatedAt: new Date().toISOString(), erids: nextList }, null, 2) + "\n",
      "utf-8",
    );
    console.log(`✓ Обновлён dynamic-overdue-erids.json: ${prevList.length} -> ${nextList.length} ERID`);
  } else {
    console.log(`ℹ️ Новых просроченных 30-дневных ERID нет (${nextList.length}).`);
  }
  if (report.deletedTelegramMessageIds.length > 0) {
    console.log(`✓ Удалено устаревших 30-дневных постов в Telegram: ${report.deletedTelegramMessageIds.length}`);
  }
}

main().catch((err) => {
  console.error("Ошибка sync-overdue-erids:", err.message);
  process.exit(0);
});
