/**
 * scripts/perfluence-flash-deals.mjs
 * 
 * Модуль автоматического мониторинга раздела новостей и уведомлений Perfluence (https://dash.perfluence.net/entries/list).
 * 
 * Назначение:
 * 1. Загружает список свежих анонсов и уведомлений через быстрый HTTP-запрос (0.3 сек).
 * 2. Детектирует временные «Флеш-акции», «Повышения ставок» и «Ограниченные супер-бонусы».
 * 3. Извлекает ID проекта, название рекламодателя, суть акции и сроки.
 * 4. Предоставляет getFlashDeals() для приоритизации таких офферов ВНЕ ОЧЕРЕДИ в Telegram-пайплайне.
 */

import fs from "node:fs";
import path from "node:path";

const SESSION_FILE = path.join(process.cwd(), "data", "perfluence_session.json");
const FLASH_CACHE_FILE = path.join(process.cwd(), "data", "flash_deals.json");

function getSessionCookies() {
  if (!fs.existsSync(SESSION_FILE)) {
    return null;
  }
  try {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
    const cookieHeader = (session.cookies || []).map(c => `${c.name}=${c.value}`).join("; ");
    return cookieHeader;
  } catch (err) {
    return null;
  }
}

/**
 * Парсит карточки новостей из HTML страницы /entries/list
 */
function parseEntriesHtml(html) {
  const itemMatches = [...html.matchAll(/<div[^>]*class="[^"]*\bitem\b[^"]*"[^>]*data-key="(\d+)"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>\s*<\/div>/gi)];
  
  const results = [];

  for (const m of itemMatches) {
    const id = m[1];
    const block = m[2];

    const title = block.match(/<a[^>]*class="[^"]*h7[^"]*"[^>]*>([\s\S]*?)<\/a>/i)?.[1]?.replace(/<[^>]*>/g, "").trim() || "";
    const desc = block.match(/<div class="text-2l my-1">([\s\S]*?)<\/div>/i)?.[1]?.replace(/<[^>]*>/g, "").trim() || "";
    const date = block.match(/<div class="flex-shrink-0">([\s\S]*?)<\/div>/i)?.[1]?.replace(/<[^>]*>/g, "").trim() || "";
    const projMatch = block.match(/href="\/project\/(\d+)\/accounts">([\s\S]*?)<\/a>/i);
    const projectId = projMatch?.[1] ? parseInt(projMatch[1], 10) : null;
    const projectName = projMatch?.[2]?.replace(/<[^>]*>/g, "").trim() || null;

    const fullText = `${title} ${desc}`.toLowerCase();

    // Маркеры повышенной доходности и флеш-акций
    const isFlash = /флеш|flash|только сегодня|только \d+|срочно/i.test(fullText);
    const isRateHike = /повышен|повышение ставки|рост ставки|повышенный доход|ставка увеличена/i.test(fullText);
    const isNewBonus = /новый бонус|увеличенный бонус|спецуслови/i.test(fullText);

    if (isFlash || isRateHike || isNewBonus) {
      let badge = "⚡ ФЛЕШ-АКЦИЯ";
      let priorityScore = 200;

      if (isRateHike) {
        badge = "📈 ПОВЫШЕННАЯ СТАВКА";
        priorityScore = 250;
      } else if (isFlash) {
        badge = "⚡ ФЛЕШ-АКЦИЯ";
        priorityScore = 220;
      } else if (isNewBonus) {
        badge = "🔥 НОВЫЙ БОНУС";
        priorityScore = 180;
      }

      results.push({
        id,
        projectId,
        projectName,
        title,
        desc,
        date,
        badge,
        priorityScore,
        detectedAt: new Date().toISOString()
      });
    }
  }

  return results;
}

/**
 * Получает актуальные флеш-акции и повышенные ставки
 */
export async function getFlashDeals(forceRefresh = false) {
  // Проверяем кэш, если он свежее 4 часов
  if (!forceRefresh && fs.existsSync(FLASH_CACHE_FILE)) {
    try {
      const cached = JSON.parse(fs.readFileSync(FLASH_CACHE_FILE, "utf8"));
      const ageHours = (Date.now() - new Date(cached.updatedAt || 0).getTime()) / (1000 * 60 * 60);
      if (ageHours < 4 && Array.isArray(cached.deals)) {
        return cached.deals;
      }
    } catch (e) {
      // Игнорируем ошибку чтения кэша
    }
  }

  const cookieHeader = getSessionCookies();
  if (!cookieHeader) {
    console.warn("[FlashDeals] Сессия Perfluence отсутствует, мониторинг новостей пропущен.");
    return [];
  }

  try {
    const url = "https://dash.perfluence.net/entries/list";
    const res = await fetch(url, {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0"
      }
    });

    if (!res.ok) {
      console.warn(`[FlashDeals] Запрос к ${url} вернул статус ${res.status}`);
      return [];
    }

    const html = await res.text();
    const deals = parseEntriesHtml(html);

    // Сохраняем в кэш
    const cacheData = {
      updatedAt: new Date().toISOString(),
      count: deals.length,
      deals
    };
    fs.writeFileSync(FLASH_CACHE_FILE, JSON.stringify(cacheData, null, 2), "utf8");

    return deals;
  } catch (error) {
    console.warn("[FlashDeals] Ошибка при парсинге новостей:", error.message);
    return [];
  }
}

// Прямой запуск для тестирования
if (process.argv[1]?.includes("perfluence-flash-deals.mjs")) {
  getFlashDeals(true).then(deals => {
    console.log(`\n⚡ Найдено ${deals.length} активных спецпредложений/флеш-акций:`);
    deals.forEach(d => {
      console.log(`\n[${d.badge}] Проект #${d.projectId} (${d.projectName})`);
      console.log(`  Заголовок: ${d.title}`);
      console.log(`  Суть: ${d.desc}`);
      console.log(`  Дата: ${d.date}`);
      console.log(`  Приоритет: +${d.priorityScore} очков`);
    });
  });
}
