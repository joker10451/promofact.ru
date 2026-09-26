/**
 * scripts/verify-sync-status.mjs
 * Проверка статуса завершения синхронизации каталога.
 * При статусах fallback или failed:
 * - Выводит подробное предупреждение с причиной в логи GitHub Actions.
 * - Откатывает изменения фида и меты к состоянию HEAD, чтобы не сохранять резервные/неудачные данные.
 * - Устанавливает is_success=false в GITHUB_OUTPUT, блокируя создание PR и последующие шаги.
 */

import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

export function checkSyncStatus({
  metaPath = path.resolve("src/data/sync-meta.json"),
  feedPath = path.resolve("src/data/perfluence-feed.json"),
} = {}) {
  if (!fs.existsSync(metaPath)) {
    return {
      status: "failed",
      isSuccess: false,
      error: "Файл метаданных sync-meta.json не найден",
    };
  }

  try {
    const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
    const status = meta.status || "failed";
    const isSuccess = status === "success";

    return {
      status,
      isSuccess,
      error: meta.error || null,
      meta,
    };
  } catch (err) {
    return {
      status: "failed",
      isSuccess: false,
      error: `Ошибка парсинга sync-meta.json: ${err.message}`,
    };
  }
}

// Запуск напрямую из CLI / GitHub Actions
const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve("scripts/verify-sync-status.mjs");

if (isDirectRun) {
  const result = checkSyncStatus();
  console.log(`Проверка результата синхронизации: статус '${result.status}'`);

  const githubOutput = process.env.GITHUB_OUTPUT;
  if (githubOutput) {
    fs.appendFileSync(githubOutput, `is_success=${result.isSuccess}\n`);
    fs.appendFileSync(githubOutput, `sync_status=${result.status}\n`);
  }

  if (!result.isSuccess) {
    const errorMsg = result.error || "Неизвестная ошибка синхронизации";
    console.error(`::error title=Синхронизация не завершена::Статус: ${result.status}. Причина: ${errorMsg}`);
    console.log("Откат локальных файлов каталога для предотвращения сохранения fallback/failed данных...");
    try {
      execSync("git restore src/data/perfluence-feed.json src/data/sync-meta.json", {
        stdio: "inherit",
      });
      console.log("✓ Данные каталога возвращены к исходному состоянию HEAD.");
    } catch (err) {
      console.error("Ошибка при откате файлов через git restore:", err.message);
    }
    process.exit(1);
  } else {
    console.log("✓ Синхронизация каталога успешно завершена со статусом 'success'. Разрешён переход к валидационным тестам.");
  }
}
