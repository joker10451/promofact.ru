/**
 * scripts/pipeline-orchestrator.mjs
 * 
 * Полный замкнутый автономный цикл (Full Autonomous Loop):
 * 1. Очистка: удаляет истекшие акции из Telegram по таймеру
 * 2. Авто-подключение: сканирует каталог Perfluence и подключает свежие офферы (если есть сессия)
 * 3. Отбор: выбирает лучший оффер из активных (хит, анти-повтор 7 дней)
 * 4. Публикация: генерирует пост, проверяет erid и промокод, шлет в @smart_zakupka
 * 5. Сдача отчета: отправляет ссылку модераторам в Perfluence
 */

import fs from "node:fs";
import path from "node:path";
import { submitReport } from "./perfluence-report.mjs";
import { takeNewOffers } from "./perfluence-take-offers.mjs";
import { generatePromoBanner } from "./banner-generator.mjs";
import { getFlashDeals, autoActivateFlashProjects } from "./perfluence-flash-deals.mjs";
import { postToVk } from "./vk-crossposter.mjs";
import { checkNewEarnings } from "./perfluence-earnings-monitor.mjs";
import { pingIndexNow } from "./indexnow-ping.mjs";

const DATA_DIR = path.join(process.cwd(), "data");
const HISTORY_FILE = path.join(DATA_DIR, "posted_promos.json");
const SESSION_FILE = path.join(DATA_DIR, "perfluence_session.json");

// Чтение переменных окружения: сначала process.env (для GitHub Actions), затем fallback на .env.local
const envContent = fs.existsSync(".env.local") ? fs.readFileSync(".env.local", "utf8") : "";
const fileEnv = {};
for (const line of envContent.split(/\r?\n/)) {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || "").trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1).trim();
    }
    fileEnv[match[1]] = val;
  }
}

const WIDGET_URL = (process.env.PERFLUENCE_WIDGET_URL || fileEnv.PERFLUENCE_WIDGET_URL || "").replace(/["']/g, "").trim();
const BOT_TOKEN = (process.env.TELEGRAM_BOT_TOKEN || fileEnv.TELEGRAM_BOT_TOKEN || "").replace(/["']/g, "").trim();
const CHANNEL_ID = (process.env.TELEGRAM_CHANNEL_ID || fileEnv.TELEGRAM_CHANNEL_ID || "@smart_zakupka").replace(/["']/g, "").trim();
const ADMIN_CHAT_ID = (process.env.TELEGRAM_ADMIN_CHAT_ID || fileEnv.TELEGRAM_ADMIN_CHAT_ID || "6141363106").replace(/["']/g, "").trim();

/**
 * Адреса страниц магазинов на сайте. Те же, что в src/lib/perfluence.ts:
 * названия проектов в кабинете («Додо пицца Юг») в адрес не годятся.
 */
const STORE_SLUGS = {
  1653: "dodo-pizza",
  900: "bethowen",
  1483: "citydrive",
  2576: "sberprime",
  2548: "m-kosmetik",
  3641: "cozy-home",
  3807: "librederm",
  1977: "vazhnaya-ryba",
};

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y",
  ь: "", э: "e", ю: "yu", я: "ya",
};

function storeSlugOf(storeId, storeName) {
  if (STORE_SLUGS[storeId]) return STORE_SLUGS[storeId];
  return String(storeName)
    .toLowerCase()
    .split("")
    .map((ch) => (ch in TRANSLIT ? TRANSLIT[ch] : ch))
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "magazin";
}

const MONTHS = ["января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря"];

function formatExpires(value) {
  const ru = String(value).match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ru) return `${Number(ru[1])} ${MONTHS[Number(ru[2]) - 1] ?? ru[2]}`;
  const iso = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${Number(iso[3])} ${MONTHS[Number(iso[2]) - 1] ?? iso[2]}`;
  return String(value);
}

function plural(n, one, few, many) {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}

function cleanText(value) {
  return String(value || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    }
  } catch {}
  return { postedIds: [], history: [] };
}

function saveHistory(history) {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2), "utf8");
}

async function deleteTelegramMessage(messageId) {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/deleteMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHANNEL_ID, message_id: messageId })
  });
  return await res.json();
}

async function sendTelegramPost(text, buttons = [], imageUrl = null) {
  const replyMarkup = buttons.length > 0 ? { inline_keyboard: buttons } : undefined;

  // Если есть локальный файл или ссылка на баннер — шлем как фото с подписью
  if (imageUrl) {
    const photoUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        let photoRes;
        if (fs.existsSync(imageUrl)) {
          const fileBuffer = fs.readFileSync(imageUrl);
          const formData = new FormData();
          formData.append("chat_id", CHANNEL_ID);
          formData.append("photo", new Blob([fileBuffer], { type: "image/png" }), "banner.png");
          formData.append("caption", text.slice(0, 1024));
          formData.append("parse_mode", "HTML");
          if (replyMarkup) formData.append("reply_markup", JSON.stringify(replyMarkup));

          photoRes = await fetch(photoUrl, { method: "POST", body: formData });
        } else {
          photoRes = await fetch(photoUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: CHANNEL_ID,
              photo: imageUrl,
              caption: text.slice(0, 1024),
              parse_mode: "HTML",
              reply_markup: replyMarkup
            })
          });
        }
        const photoData = await photoRes.json();
        if (photoData.ok) return photoData;
        console.warn(`⚠ sendPhoto попытка ${attempt} не удалась:`, photoData.description);
      } catch (photoErr) {
        console.warn(`⚠ sendPhoto попытка ${attempt} ошибка:`, photoErr.message);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000));
      }
    }
  }

  // Текстовая отправка (fallback)
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: CHANNEL_ID,
      text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
      disable_web_page_preview: false
    })
  });
  return await res.json();
}

async function fetchChannelSpecificOffer(projectId, targetAccount = "smart_zakupka") {
  if (!fs.existsSync(SESSION_FILE) || !projectId) return null;
  try {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
    const cookies = session.cookies.map(c => `${c.name}=${c.value}`).join("; ");
    const url = `https://dash.perfluence.net/project/${projectId}/accounts`;
    const res = await fetch(url, {
      headers: { "Cookie": cookies, "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();
    const idx = html.indexOf(targetAccount);
    if (idx === -1) return null;

    const sub = html.slice(idx, idx + 8000);
    const linkMatch = sub.match(/https:\/\/[a-z0-9.]+\.prfl\.me\/[^\s"'<>]+/i);
    const eridMatch = sub.match(/erid:\s*([A-Za-z0-9_-]+)/i);
    const ordTextMatch = sub.match(/Маркер и токен[\s\S]*?<div[^>]*>([\s\S]*?)<\/div>/i) || sub.match(/Реклама\.[\s\S]*?(?=<\/div>|<div)/i);

    const blocks = sub.split('<div class="modal-collapsing-block-details">');
    const promos = [];
    for (const b of blocks.slice(1)) {
      const codeMatch = b.match(/data-clipboard-text="([^"]+)"/i);
      const rubMatch = b.match(/на\s+RUB[^\d]*(\d+)/i) || b.match(/на\s+(\d+)\s*₽/i) || b.match(/на\s+(\d+%)/i);
      const dateMatch = b.match(/до\s*(\d{2}\.\d{2}\.\d{4})/i);
      const descMatch = b.match(/class="modal-collapsing-block-content">([\s\S]*?)<\/div>/i);
      if (codeMatch && !codeMatch[1].startsWith("http") && !codeMatch[1].startsWith("Реклама")) {
        promos.push({
          code: codeMatch[1].trim(),
          discountNum: rubMatch ? parseInt(rubMatch[1], 10) : 0,
          bonus: descMatch ? descMatch[1].trim() : (rubMatch ? `Скидка ${rubMatch[0]}` : "Скидка"),
          expires: dateMatch ? dateMatch[1] : null
        });
      }
    }

    let ordText = ordTextMatch ? ordTextMatch[0].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim() : null;
    if (ordText && ordText.startsWith("Маркер и токен")) {
      ordText = ordText.replace(/^Маркер и токен\s*/, "");
    }

    return {
      affUrl: linkMatch ? linkMatch[0] : null,
      ordMarker: eridMatch ? eridMatch[1] : null,
      ordText,
      promos
    };
  } catch {
    return null;
  }
}

async function fetchProjectTemplateImage(projectId) {
  if (!fs.existsSync(SESSION_FILE) || !projectId) return null;
  const url = `https://dash.perfluence.net/project/${projectId}/templates`;
  try {
    const session = JSON.parse(fs.readFileSync(SESSION_FILE, "utf8"));
    const cookies = session.cookies.map(c => `${c.name}=${c.value}`).join("; ");
    const res = await fetch(url, {
      headers: { "Cookie": cookies, "User-Agent": "Mozilla/5.0" }
    });
    if (!res.ok) return null;
    const html = await res.text();

    const itemRegex = /<div[^>]+data-template-size-type="([^"]*)"[^>]*data-template-post-type="([^"]*)"[\s\S]*?<img[^>]+src="(https:\/\/s3sc\.perfluence\.net\/screens\/[^"]+)"/gi;
    let m;
    const templates = [];
    while ((m = itemRegex.exec(html)) !== null) {
      templates.push({
        sizeType: m[1],
        postType: m[2],
        url: m[3]
      });
    }

    if (templates.length === 0) {
      const fallbackMatch = html.match(/src="(https:\/\/s3sc\.perfluence\.net\/screens\/[^"]+)"/i);
      return fallbackMatch ? fallbackMatch[1] : null;
    }

    // Приоритет: square или landscape для постов (post)
    const postSquare = templates.find(t => t.postType === "post" && t.sizeType === "square");
    if (postSquare) return postSquare.url;

    const postLandscape = templates.find(t => t.postType === "post" && t.sizeType === "landscape");
    if (postLandscape) return postLandscape.url;

    const anyPost = templates.find(t => t.postType === "post");
    if (anyPost) return anyPost.url;

    return templates[0].url;
  } catch {
    return null;
  }
}

export async function runPipeline(options = { dryRun: false, takeOffers: true }) {
  console.log("==================================================");
  console.log("   🚀 ПОЛНЫЙ АВТОНОМНЫЙ ЦИКЛ (AUTONOMOUS PIPELINE) ");
  console.log("==================================================");

  // ФАЗА 0: Мониторинг новых заказов, конверсий и заработка
  console.log("\n[Фаза 0] Мониторинг новых заказов и начислений...");
  try {
    const earningsRes = await checkNewEarnings({ notify: !options.dryRun });
    if (earningsRes.newOrders.length > 0) {
      console.log(` -> 🎉 Зафиксировано ${earningsRes.newOrders.length} новых начислений! Уведомления отправлены админу.`);
    } else {
      console.log(` -> Все начисления актуальны (всего: ${earningsRes.totalRub?.toLocaleString("ru-RU")} ₽).`);
    }
  } catch (eErr) {
    console.warn(" -> ⚠ Ошибка проверки начислений:", eErr.message);
  }

  // ФАЗА 1: Очистка просроченных постов
  console.log("\n[Фаза 1] Проверка и автоудаление истекших акций...");
  const historyData = loadHistory();
  const now = Date.now();
  let cleanedCount = 0;

  for (const item of historyData.history) {
    if (!item.deleted && item.messageId && item.expires) {
      const expTime = new Date(`${item.expires}T23:59:59`).getTime();
      if (now > expTime) {
        console.log(` -> Оффер "${item.store}" (${item.code}) истек ${item.expires}. Удаление #${item.messageId}...`);
        if (!options.dryRun) {
          const delRes = await deleteTelegramMessage(item.messageId);
          if (delRes.ok) {
            item.deleted = true;
            item.deletedAt = new Date().toISOString();
            cleanedCount++;
            console.log(`    ✓ Сообщение #${item.messageId} удалено из канала.`);
          }
        }
      }
    }
  }
  if (cleanedCount > 0) saveHistory(historyData);

  // ФАЗА 2: Автоматический поиск и взятие новых офферов в Perfluence
  if (options.takeOffers && fs.existsSync(SESSION_FILE)) {
    console.log("\n[Фаза 2] Сканирование каталога и авто-взятие новых офферов...");
    try {
      await takeNewOffers({ maxOffers: 2, headless: true });
    } catch (err) {
      console.warn(`[Фаза 2] Авто-взятие пропущено: ${err.message}`);
    }
  } else {
    console.log("\n[Фаза 2] Сессия браузера в облаке не передана, авто-взятие пропущено. Переходим к отбору из API...");
  }

  // ФАЗА 3: Загрузка готовых офферов из виджета
  console.log("\n[Фаза 3] Анализ активных офферов из Perfluence API...");
  let items = [];
  try {
    if (WIDGET_URL) {
      const res = await fetch(WIDGET_URL);
      if (res.ok) {
        const json = await res.json();
        items = Array.isArray(json.data) ? json.data : [];
      }
    }
  } catch (e) {
    console.warn("Ошибка загрузки виджета:", e.message);
  }

  console.log(` -> Получено проектов из Perfluence: ${items.length}`);

  if (items.length === 0) {
    console.log("❌ Нет доступных офферов для публикации.");
    return;
  }

  // Извлекаем промокоды и проекты
  const candidates = [];
  const recentCodes = new Set(historyData.history.map(h => (h.code || "").trim().toUpperCase()).filter(Boolean));
  const recentStores = new Set(historyData.history.slice(0, 5).map(h => h.storeSlug).filter(Boolean));

  for (const item of items) {
    const project = item.project || item.shop || item;
    const storeName = project.name || project.store_name || "Магазин";
    const storeId = project.id || project.project_id;
    const groups = Array.isArray(item.groups) ? item.groups : [item];

    for (const group of groups) {
      const promos = Array.isArray(group.promocodes) ? group.promocodes : [];
      const links = Array.isArray(group.links_for_subscribers) ? group.links_for_subscribers : [];
      const landing = Array.isArray(group.landing) ? group.landing[0] : group.landing;

      const affUrl = links[0]?.link || landing?.link || project.site || "https://promofact.ru";
      const ordMarker = promos[0]?.ord_marker || landing?.ord_marker || "";
      const ordText = promos[0]?.ord_custom_text || landing?.ord_custom_text || `Реклама. ${storeName}`;

      for (const p of promos) {
        const code = (p.code || "").trim();
        if (!code) continue;
        if (recentCodes.has(code.toUpperCase())) continue;

        candidates.push({
          storeId,
          storeName,
          storeSlug: storeSlugOf(storeId, storeName),
          code,
          bonus: p.bonus_name || p.name || p.comment || "Скидка по промокоду",
          // p.terms у Perfluence почти всегда пустой, поэтому пост выходил
          // из одного заголовка. Берём описание бонуса и условия проекта.
          terms: p.promo_terms || p.terms || "",
          about: project.subscribers_condition || project.product_info || "",
          // Виджет отдаёт срок в поле date («30.09.2026»), не expires.
          expires: p.date || p.expires || null,
          region: Array.isArray(p.region_promo) ? p.region_promo.join(", ") : p.region_promo || "",
          repeatOrder: Boolean(p.repeat_order),
          codesInStore: promos.length,
          // Остальные коды этого же магазина: раньше в пост уходил один код,
          // хотя у проекта их бывает три-четыре, и подписчик не видел,
          // что есть вариант выгоднее под его сумму заказа.
          otherPromos: promos
            .filter((x) => (x.code || "").trim() && (x.code || "").trim() !== code)
            .map((x) => ({
              code: (x.code || "").trim(),
              bonus: x.bonus_name || x.name || x.comment || "",
              expires: x.date || x.expires || null,
            })),
          affUrl,
          ordMarker,
          ordText,
          isHit: Boolean(p.is_hit || project.is_hit)
        });
      }
    }
  }

  // Умный алгоритм скоринга и жестких анти-повторов:
  // 1. Никогда не повторять промокоды (уже отфильтровано в recentCodes)
  // 2. Жесткий запрет на выход магазина из последних 10 постов
  // 3. Ротация категорий и брендов
  const HIGH_PRIORITY_BRANDS = [
    "Start.ru",
    "Яндекс Лавка",
    "ВкусВилл Доставка",
    "Додо пицца Юг",
    "Перекрёсток Доставка",
    "Яндекс Цветы",
    "Отелло",
    "Ситидрайв",
    "FARFOR",
    "Ив Роше",
    "Librederm",
    "Netprint",
    "СберПрайм"
  ];

  // [Фаза 3.1] Мониторинг и авто-активация «Флеш-акций» и повышенных ставок
  console.log("\n[Фаза 3.1] Мониторинг и авто-активация «Флеш-акций» рекламодателей...");
  let flashDeals = [];
  const flashMap = new Map();
  try {
    // 1. Авто-активация проектов с флеш-акциями в 1 клик
    if (options.takeOffers !== false) {
      await autoActivateFlashProjects();
    }

    flashDeals = await getFlashDeals();
    for (const d of flashDeals) {
      if (d.projectId) flashMap.set(String(d.projectId), d);
      if (d.projectName) flashMap.set(d.projectName.toLowerCase(), d);
    }
    if (flashDeals.length > 0) {
      console.log(` -> Обнаружено активных спецпредложений/флеш-акций: ${flashDeals.length}`);
      flashDeals.forEach(f => console.log(`    ⚡ [${f.badge}] #${f.projectId} "${f.projectName}": ${f.title}`));
    } else {
      console.log(" -> В новостях нет активных флеш-акций на сегодня.");
    }

    // 2. Добавляем активированные флеш-офферы в пул кандидатов, если их еще не было
    for (const deal of flashDeals) {
      if (!deal.projectId) continue;
      const exists = candidates.some(c => String(c.storeId) === String(deal.projectId) || c.storeName.toLowerCase() === deal.projectName.toLowerCase());
      if (!exists) {
        const channelData = await fetchChannelSpecificOffer(deal.projectId, "smart_zakupka");
        if (channelData && channelData.promos && channelData.promos.length > 0) {
          for (const p of channelData.promos) {
            if (!p.code || recentCodes.has(p.code.toUpperCase())) continue;
            candidates.push({
              storeId: deal.projectId,
              storeName: deal.projectName,
              code: p.code,
              bonus: p.bonus || deal.title,
              terms: deal.desc || "",
              expires: p.expires || null,
              affUrl: channelData.affUrl,
              ordMarker: channelData.ordMarker,
              ordText: channelData.ordText || `Реклама. ${deal.projectName}`,
              isHit: true,
              flashDeal: deal
            });
            console.log(` -> ⚡ Флеш-оффер "${deal.projectName}" (#${deal.projectId}) добавлен в пул кандидатов с промокодом [${p.code}]!`);
          }
        }
      }
    }
  } catch (err) {
    console.warn(" -> Ошибка мониторинга флеш-акций:", err.message);
  }

  const recentStoresList = historyData.history.slice(0, 10).map(h => (h.store || "").toLowerCase());
  const lastStore = historyData.history[0]?.store?.toLowerCase();

  // Рассчитываем давность каждого магазина
  const storeLastPostTime = new Map();
  for (const h of historyData.history) {
    if (h.store && !storeLastPostTime.has(h.store.toLowerCase())) {
      storeLastPostTime.set(h.store.toLowerCase(), new Date(h.date || 0).getTime());
    }
  }

  // Сначала пытаемся отобрать кандидатов, которых гарантированно не было в последних 10 постах,
  // ЛИБО у которых прямо сейчас идет горячая флеш-акция (пропуск вне очереди!)
  const freshCandidates = candidates.filter(c => {
    const isFlash = flashMap.has(String(c.storeId)) || flashMap.has(c.storeName.toLowerCase());
    if (isFlash && (!lastStore || c.storeName.toLowerCase() !== lastStore)) {
      return true; // Пропускаем вне очереди горячие флеш-акции!
    }
    return !recentStoresList.includes(c.storeName.toLowerCase());
  });
  const candidatePool = freshCandidates.length > 0 ? freshCandidates : candidates;

  const scored = candidatePool.map(c => {
    let score = 100;
    const storeLower = c.storeName.toLowerCase();
    const flashDeal = flashMap.get(String(c.storeId)) || flashMap.get(storeLower);

    // ПРИОРИТЕТ ВНЕ ОЧЕРЕДИ: Флеш-акции и повышенные ставки от рекламодателей
    if (flashDeal) {
      score += flashDeal.priorityScore || 220;
      c.flashDeal = flashDeal;
    }

    // Штраф, если магазин уже публиковался когда-либо
    if (storeLastPostTime.has(storeLower)) {
      const daysSince = Math.floor((now - storeLastPostTime.get(storeLower)) / (24 * 60 * 60 * 1000));
      if (daysSince < 30) {
        score -= (30 - daysSince) * 10;
      } else {
        score += 20;
      }
    } else {
      score += 50; // Бонус новым магазинам, которых еще не было в канале!
    }

    // Жесткий запрет на повтор последнего магазина
    if (lastStore && storeLower === lastStore) {
      score -= 1000;
    }

    // Бонус проектам с повышенными ставками / высокой конверсией
    if (HIGH_PRIORITY_BRANDS.some(b => c.storeName.includes(b))) {
      score += 40;
    }

    // Бонус за скидку в рублях или высокий процент
    if (c.bonus.includes("%") || c.bonus.includes("₽") || c.isHit) {
      score += 15;
    }

    return { ...c, score };
  });

  // Сортируем по итоговому баллу
  scored.sort((a, b) => b.score - a.score);

  // Ссылка и erid должны принадлежать публикации канала @smart_zakupka.
  // В виджете лежит ссылка последней публикации — она может быть от аккаунта
  // «Сайт», и тогда заказы из канала засчитаются сайту, а пост в Telegram
  // окажется с чужим erid. Поэтому идём по кандидатам сверху вниз и берём
  // первого, у кого в кабинете есть публикация для канала.
  let selected = null;
  for (const candidate of scored.slice(0, 8)) {
    if (!candidate.storeId) continue;
    const channelData = await fetchChannelSpecificOffer(candidate.storeId, "smart_zakupka");
    if (!channelData || !channelData.affUrl || !channelData.ordMarker) {
      console.log(
        ` -> «${candidate.storeName}»: для канала нет публикации с ссылкой и erid, пропускаем`,
      );
      continue;
    }

    candidate.affUrl = channelData.affUrl;
    candidate.ordMarker = channelData.ordMarker;
    if (channelData.ordText) candidate.ordText = channelData.ordText;

    // Самый выгодный код канала, которого ещё не было в постах
    const validPromos = (channelData.promos || [])
      .filter((p) => p.code && !recentCodes.has(p.code.toUpperCase()))
      .sort((a, b) => b.discountNum - a.discountNum);

    if (validPromos.length > 0) {
      candidate.code = validPromos[0].code;
      candidate.bonus = validPromos[0].bonus;
      if (validPromos[0].expires) candidate.expires = validPromos[0].expires;
      candidate.otherPromos = validPromos.slice(1).map((p) => ({
        code: p.code,
        bonus: p.bonus,
        expires: p.expires,
      }));
    } else if (!channelData.promos?.some((p) => p.code === candidate.code)) {
      // Кода из виджета нет среди кодов канала — значит он не наш.
      console.log(` -> «${candidate.storeName}»: код ${candidate.code} не выдан каналу, пропускаем`);
      continue;
    }

    selected = candidate;
    break;
  }

  if (!selected) {
    console.log(
      "\n❌ Ни по одному офферу нет публикации для канала @smart_zakupka." +
        " Зайдите в кабинет Perfluence и нажмите «Получить промокод» для канала," +
        " либо проверьте, жива ли сессия в data/perfluence_session.json.",
    );
    return;
  }

  console.log(`\n[Фаза 4] Выбран лучший оффер: "${selected.storeName}" (балл: ${selected.score}, код: ${selected.code}, бонус: ${selected.bonus})${selected.flashDeal ? ` [${selected.flashDeal.badge}]` : ""}`);

  // Формируем пост
  const postLines = [];
  if (selected.flashDeal && !selected.flashDeal.isInternalOnly && selected.flashDeal.audienceDesc) {
    postLines.push(`${selected.flashDeal.badge}`);
    postLines.push(`📢 <b>${selected.flashDeal.title}</b> — <i>${selected.flashDeal.audienceDesc}</i>\n`);
  }
  postLines.push(`${selected.isHit ? "🔥" : "🏷"} <b>${selected.storeName} — ${selected.bonus}</b>\n`);
  postLines.push(`🎟 Промокод: <code>${selected.code}</code>`);
  postLines.push(`<i>(нажмите на код — он скопируется в буфер)</i>\n`);

  // Блок условий: раньше он был единственным и появлялся, только если
  // рекламодатель заполнил terms. Теперь собираем строки из полей, которые
  // виджет отдаёт всегда, — пост перестал быть «кодом в пустоте».
  const facts = [];
  facts.push(selected.repeatOrder ? "Первый и повторные заказы" : "Только первый заказ");
  if (selected.region && selected.region !== "RU") facts.push(`Города: ${selected.region}`);
  if (selected.expires) facts.push(`Действует до ${formatExpires(selected.expires)}`);

  postLines.push("📌 <b>Условия:</b>");
  facts.forEach((f) => postLines.push(`• ${f}`));

  // Остальные коды магазина — прямо в посте. Подписчик сам выберет тот, что
  // подходит под его сумму заказа, вместо того чтобы уходить искать на сайт.
  const others = (selected.otherPromos || []).slice(0, 3);
  if (others.length) {
    postLines.push(`\n🎁 <b>Ещё коды ${selected.storeName}:</b>`);
    for (const o of others) {
      const until = o.expires ? ` (до ${formatExpires(o.expires)})` : "";
      const what = cleanText(o.bonus).slice(0, 80);
      postLines.push(`• <code>${o.code}</code> — ${what}${until}`);
    }
  }

  const details = cleanText(selected.terms) || cleanText(selected.about);
  if (details) postLines.push(`\nℹ️ ${details.slice(0, 220)}`);

  postLines.push("");
  if (selected.ordMarker && !selected.ordText.includes(selected.ordMarker)) {
    postLines.push(`<i>${selected.ordText} erid: ${selected.ordMarker}</i>`);
  } else {
    postLines.push(`<i>${selected.ordText}</i>`);
  }

  const postText = postLines.join("\n");
  const buttons = [
    [{ text: `🛍 В магазин ${selected.storeName} →`, url: selected.affUrl }],
    // Раньше вторая кнопка вела на главную. Ведём на страницу магазина:
    // там все его коды, условия и маркировка.
    [{ text: `🌐 Все промокоды ${selected.storeName}`, url: `https://promofact.ru/store/${selected.storeSlug}` }]
  ];

  // 1. Ищем официальный промо-макет проекта в Perfluence
  const bgTemplateUrl = await fetchProjectTemplateImage(selected.storeId);
  
  // 2. Генерируем брендовый баннер с ВПЕЧАТАННЫМ персональным промокодом!
  try {
    selected.bannerPath = await generatePromoBanner({
      storeName: selected.storeName,
      code: selected.code,
      bonus: selected.bonus,
      bgImageUrl: bgTemplateUrl,
      badgeText: selected.flashDeal?.badge || "🔥 ТОП СКИДКА"
    });
    console.log(` -> 🎨 Сгенерирован баннер с вашим промокодом [${selected.code}]: ${selected.bannerPath}`);
  } catch (genErr) {
    console.warn("⚠ Не удалось сгенерировать баннер, отправляем с исходным макетом:", genErr.message);
    selected.bannerPath = bgTemplateUrl;
  }

  if (options.dryRun) {
    console.log("\n[DRY RUN] Баннер: " + (selected.bannerPath || "нет (текстовый)"));
    console.log("[DRY RUN] Текст поста:\n" + postText);
    return;
  }

  // Публикуем в Telegram (с баннером, где напечатан промокод)
  console.log(` -> Отправка поста в канал ${CHANNEL_ID}...`);
  const postRes = await sendTelegramPost(postText, buttons, selected.bannerPath);

  if (!postRes.ok) {
    console.error("❌ Ошибка отправки в Telegram:", postRes.description);
    return;
  }

  const messageId = postRes.result.message_id;
  const channelClean = CHANNEL_ID.replace("@", "");
  const postUrl = `https://t.me/${channelClean}/${messageId}`;
  console.log(`\n🎉 ПОСТ УСПЕШНО ОПУБЛИКОВАН! Ссылка: ${postUrl}`);

  // Сохраняем в историю
  historyData.history.unshift({
    id: Date.now(),
    code: selected.code,
    store: selected.storeName,
    messageId,
    postUrl,
    expires: selected.expires,
    date: new Date().toISOString()
  });
  saveHistory(historyData);

  // ФАЗА 4.1: Автоматический кросспостинг во ВКонтакте (сообщество vk.com/promofact)
  try {
    const vkResult = await postToVk({
      storeName: selected.storeName,
      code: selected.code,
      bonus: selected.bonus,
      terms: selected.terms,
      affUrl: selected.affUrl,
      ordMarker: selected.ordMarker,
      ordText: selected.ordText,
      bannerPath: selected.bannerPath,
      flashDeal: selected.flashDeal
    });
    if (vkResult.ok) {
      console.log(` -> 🌐 Кросспостинг в VK: успешно опубликован (${vkResult.postUrl})`);
    }
  } catch (vkErr) {
    console.warn(" -> ⚠ Ошибка кросспостинга во ВКонтакте:", vkErr.message);
  }

  // ФАЗА 4.2: Мгновенное SEO-оповещение поисковых систем (IndexNow: Яндекс, Bing)
  console.log("\n[Фаза 4.2] Мгновенное оповещение Яндекс и Bing (IndexNow)...");
  try {
    const cleanStoreSlug = selected.storeName
      .toLowerCase()
      .replace(/[^a-zа-я0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const pingUrls = [
      `https://promofact.ru/store/${cleanStoreSlug}`,
      "https://promofact.ru",
      "https://promofact.ru/promokody"
    ];

    const idxRes = await pingIndexNow(pingUrls);
    if (idxRes.ok) {
      console.log(` -> ✓ IndexNow: поисковики мгновенно уведомлены о скидках "${selected.storeName}" (${idxRes.sentUrls.length} URL).`);
    }
  } catch (idxErr) {
    console.warn(" -> ⚠ Ошибка отправки IndexNow:", idxErr.message);
  }

  // ФАЗА 5: Авто-сдача отчета в Perfluence (если сессия есть)
  if (fs.existsSync(SESSION_FILE) && selected.storeId) {
    console.log(`\n[Фаза 5] Авто-сдача отчета в Perfluence для проекта #${selected.storeId}...`);
    try {
      await submitReport(selected.storeId, postUrl, { headless: true });
      console.log("✓ Отчет успешно сдан модераторам!");
    } catch (repErr) {
      console.warn("⚠ Сдача отчета через Playwright:", repErr.message);
    }
  }

  // Уведомление в ЛС админу
  if (ADMIN_CHAT_ID) {
    try {
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: `📢 <b>Автоматический пост опубликован!</b>\n\n🏬 Магазин: <b>${selected.storeName}</b>\n🎟 Промокод: <code>${selected.code}</code>\n🔗 Ссылка: ${postUrl}`,
          parse_mode: "HTML"
        })
      });
    } catch {}
  }

  console.log("\n==================================================");
  console.log("   ✓ ПОЛНЫЙ ЦИКЛ АВТОМАТИЗАЦИИ УСПЕШНО ЗАВЕРШЕН   ");
  console.log("==================================================\n");
}

if (process.argv[1]?.endsWith("pipeline-orchestrator.mjs")) {
  const dryRun = process.argv.includes("--dry-run");
  const noTake = process.argv.includes("--no-take");
  runPipeline({ dryRun, takeOffers: !noTake }).catch(console.error);
}
