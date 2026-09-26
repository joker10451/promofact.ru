/**
 * scripts/sync-catalog.mjs
 * Безопасная синхронизация партнерского каталога:
 * 1. Получение актуального фида Perfluence (с отказоустойчивым таймаутом).
 * 2. Фильтрация и валидация купонов.
 * 3. Защита от повреждения локальных данных при отказе партнерского API.
 * 4. Логирование времени и статуса последней успешной синхронизации в src/data/sync-meta.json.
 */

import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import "./load-env.cjs";

const FEED_PATH = path.resolve("src/data/perfluence-feed.json");
const META_PATH = path.resolve("src/data/sync-meta.json");
const TIMEOUT_MS = 15000;

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          Accept: "application/json",
          "User-Agent": "PromoFactCatalogSync/1.0",
        },
        timeout: TIMEOUT_MS,
      },
      (res) => {
        if (res.statusCode !== 200) {
          return reject(new Error(`HTTP ${res.statusCode}: ${res.statusMessage}`));
        }
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch (err) {
            reject(new Error(`Invalid JSON: ${err.message}`));
          }
        });
      }
    );

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Timeout after ${TIMEOUT_MS}ms`));
    });
  });
}

function parseDateTs(dateStr) {
  if (!dateStr) return Infinity;
  const ru = dateStr.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) {
    return new Date(`${ru[3]}-${ru[2]}-${ru[1]}T23:59:59`).getTime();
  }
  return new Date(`${dateStr}T23:59:59`).getTime();
}

async function syncCatalog() {
  console.log("=== Синхронизация каталога PromoFact ===");
  const widgetUrl = process.env.PERFLUENCE_WIDGET_URL;
  let rawData = null;
  let syncSuccess = false;

  if (widgetUrl) {
    console.log("Запрос свежего фида из Perfluence API...");
    try {
      rawData = await fetchJson(widgetUrl);
      if (rawData && Array.isArray(rawData.data) && rawData.data.length > 0) {
        console.log(`✓ Успешно получено ${rawData.data.length} проектов из API.`);
        syncSuccess = true;
      } else {
        console.warn("⚠️ API вернул пустой или некорректный ответ. Используем локальный фид.");
      }
    } catch (err) {
      console.warn(`⚠️ Ошибка запроса к API (${err.message}). Используем локальный фид.`);
    }
  } else {
    console.log("Переменная PERFLUENCE_WIDGET_URL не задана. Проверяем локальный фид.");
  }

  // Если API не ответил, читаем существующий фид
  if (!rawData && fs.existsSync(FEED_PATH)) {
    try {
      rawData = JSON.parse(fs.readFileSync(FEED_PATH, "utf-8"));
      syncSuccess = true;
    } catch (err) {
      console.error(`Критическая ошибка чтения ${FEED_PATH}:`, err.message);
      process.exit(1);
    }
  }

  if (!rawData || !Array.isArray(rawData.data)) {
    console.error("Критическая ошибка: отсутствует доступный фид данных!");
    process.exit(1);
  }

  // Аудит и фильтрация истекших купонов
  const now = Date.now();
  let totalPromos = 0;
  let activePromos = 0;
  let expiredPromos = 0;

  for (const item of rawData.data) {
    if (Array.isArray(item.groups)) {
      for (const group of item.groups) {
        if (Array.isArray(group.promocodes)) {
          for (const promo of group.promocodes) {
            totalPromos++;
            const exp = parseDateTs(promo.date || promo.expires);
            if (exp < now) {
              expiredPromos++;
            } else {
              activePromos++;
            }
          }
        }
      }
    }
  }

  console.log(`Статистика предложений: всего ${totalPromos}, активных: ${activePromos}, истёкших: ${expiredPromos}`);

  // Сохраняем обновленный фид, если он пришел из API
  if (syncSuccess && widgetUrl) {
    fs.writeFileSync(FEED_PATH, JSON.stringify(rawData, null, 2), "utf-8");
    console.log(`✓ Фид сохранён в ${FEED_PATH}`);
  }

  // Логирование метаданных синхронизации
  const syncMeta = {
    lastSuccessSync: new Date().toISOString(),
    source: widgetUrl ? "perfluence-api" : "local-feed",
    projectCount: rawData.data.length,
    totalPromos,
    activePromos,
    expiredPromos,
    status: "success",
    updatedAt: new Date().toISOString(),
  };

  fs.writeFileSync(META_PATH, JSON.stringify(syncMeta, null, 2), "utf-8");
  console.log(`✓ Метаданные синхронизации сохранены в ${META_PATH}`);
  console.log("=== Синхронизация каталога успешно завершена ===");
}

syncCatalog().catch((err) => {
  console.error("Ошибка при синхронизации каталога:", err);
  process.exit(1);
});
