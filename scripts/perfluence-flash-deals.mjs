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
      let badge = "🔥 ТОП СКИДКА";
      let priorityScore = 200;
      let isInternalOnly = false;
      let audienceDesc = desc;

      // Если в описании упоминаются ставки/выплаты/вознаграждения — скрываем от подписчиков!
      if (isRateHike || /ставка|выплат|доход|вознагражден|cpa|cpc|руб за|рублей за/i.test(fullText)) {
        isInternalOnly = true;
        priorityScore = 250;
        badge = "🔥 ВЫБОР РЕДАКЦИИ";
        audienceDesc = null; // Подписчикам знать о ставках не нужно
      } else if (isFlash) {
        badge = "⚡ ФЛЕШ-АКЦИЯ";
        priorityScore = 220;
      } else if (isNewBonus) {
        badge = "🎁 НОВЫЙ БОНУС";
        priorityScore = 180;
      }

      results.push({
        id,
        projectId,
        projectName,
        title,
        desc,
        audienceDesc,
        isInternalOnly,
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

/**
 * ⚡ Активация оффера в 1 клик для заданной площадки (по умолчанию @smart_zakupka, ID: 3066585)
 * 
 * Если проект одобрен, но еще не получена публикация/промокод — робот автоматически
 * вызывает create-publication по AJAX (0.2 сек) и моментально активирует оффер.
 */
export async function activateProjectForChannel(projectId, accountId = "3066585") {
  const cookieHeader = getSessionCookies();
  if (!cookieHeader) {
    return { success: false, error: "Сессия Perfluence отсутствует" };
  }

  const accountsUrl = `https://dash.perfluence.net/project/${projectId}/accounts`;
  try {
    const res = await fetch(accountsUrl, {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0"
      }
    });

    if (!res.ok) {
      return { success: false, error: `HTTP ${res.status}` };
    }

    const html = await res.text();
    const accountSubstr = `accountId=${accountId}`;
    const tileSubstr = `id="pb-tile-${accountId}"`;

    const hasAccount = html.includes(accountSubstr) || html.includes(tileSubstr);
    if (!hasAccount) {
      return { success: false, error: `Площадка #${accountId} не привязана к проекту #${projectId}` };
    }

    // Проверяем, есть ли ссылка "Получить промокод" / create-publication
    const createLinks = [...html.matchAll(/href="(\/blogger\/posts\/create-publication\?[^"]*accountId=(\d+)[^"]*)"/gi)]
      .map(m => m[1].replace(/&amp;/g, "&"))
      .filter(l => l.includes(`accountId=${accountId}`));

    if (createLinks.length === 0) {
      // Возможно, оффер уже активирован
      const isAlreadyActive = html.includes(".prfl.me/") || html.includes("erid:");
      if (isAlreadyActive) {
        return { success: true, alreadyActive: true, message: "Оффер уже активен для площадки" };
      }
      return { success: false, error: "Кнопка активации (create-publication) не найдена" };
    }

    // Вызываем первый доступный лендинг create-publication через AJAX
    const targetLink = createLinks[0];
    const triggerUrl = `https://dash.perfluence.net${targetLink}`;
    console.log(`[FlashActivate] Активация проекта #${projectId} для площадки ${accountId} -> ${triggerUrl}`);

    const actRes = await fetch(triggerUrl, {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0",
        "X-Requested-With": "XMLHttpRequest"
      }
    });

    if (!actRes.ok) {
      return { success: false, error: `Ошибка вызова create-publication: HTTP ${actRes.status}` };
    }

    // Повторно проверяем страницу, чтобы извлечь выданные данные
    const verifyRes = await fetch(accountsUrl, {
      headers: {
        Cookie: cookieHeader,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      }
    });
    const verifyHtml = await verifyRes.text();

    const idx = verifyHtml.indexOf(tileSubstr) !== -1 ? verifyHtml.indexOf(tileSubstr) : verifyHtml.indexOf(accountSubstr);
    const tileChunk = idx !== -1 ? verifyHtml.slice(idx, idx + 4000) : "";

    const linkMatch = tileChunk.match(/https:\/\/[a-z0-9.]+\.prfl\.me\/[^\s"'<>]+/i);
    const eridMatch = tileChunk.match(/erid:\s*([A-Za-z0-9_-]+)/i);
    const codeMatch = tileChunk.match(/data-clipboard-text="([^"]+)"/i);

    return {
      success: true,
      activated: true,
      projectId,
      affUrl: linkMatch ? linkMatch[0] : null,
      ordMarker: eridMatch ? eridMatch[1] : null,
      code: codeMatch && !codeMatch[1].startsWith("http") && !codeMatch[1].startsWith("Реклама") ? codeMatch[1] : null
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * ⚡ Автоматически находит все свежие флеш-акции и активирует их для @smart_zakupka в 1 клик
 */
export async function autoActivateFlashProjects(accountId = "3066585") {
  console.log("==================================================");
  console.log("   ⚡ АВТО-АКТИВАЦИЯ ПРОЕКТОВ С ФЛЕШ-АКЦИЯМИ      ");
  console.log("==================================================");

  const deals = await getFlashDeals();
  const results = [];

  for (const deal of deals) {
    if (!deal.projectId) continue;
    console.log(`\n-> Проверка флеш-акции: "${deal.projectName}" (#${deal.projectId})...`);
    const actResult = await activateProjectForChannel(deal.projectId, accountId);
    
    if (actResult.alreadyActive) {
      console.log(`   ✓ Уже активирован ранее и готов к публикации!`);
    } else if (actResult.activated) {
      console.log(`   🎉 УСПЕШНО АКТИВИРОВАН В 1 КЛИК!`);
      if (actResult.code) console.log(`      Промокод: ${actResult.code}`);
      if (actResult.affUrl) console.log(`      Ссылка: ${actResult.affUrl}`);
      if (actResult.ordMarker) console.log(`      Erid: ${actResult.ordMarker}`);
    } else {
      console.log(`   ⚠ Пропущен: ${actResult.error || "не удалось активировать"}`);
    }

    results.push({
      ...deal,
      activation: actResult
    });
  }

  return results;
}

// Прямой запуск для тестирования
if (process.argv[1]?.includes("perfluence-flash-deals.mjs")) {
  const isActivate = process.argv.includes("--activate");
  if (isActivate) {
    autoActivateFlashProjects().then(() => console.log("\nАктивация завершена."));
  } else {
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
}
