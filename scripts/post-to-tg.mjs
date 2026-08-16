#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// Загрузка переменных окружения из .env.local / .env
function loadEnv() {
  const envFiles = [".env.local", ".env"];
  for (const file of envFiles) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, "utf8");
      for (const line of content.split("\n")) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eqIdx = trimmed.indexOf("=");
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

loadEnv();

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID || "@smart_zakupka";
const WIDGET_URL = process.env.PERFLUENCE_WIDGET_URL;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://promofact.ru";

const DATA_DIR = path.join(rootDir, "data");
const HISTORY_FILE = path.join(DATA_DIR, "posted_promos.json");

// Аргументы CLI
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isForce = args.includes("--force");
const isHitOnly = args.includes("--hit-only");
const isListOnly = args.includes("--list") || args.includes("--history");

const limitArg = args.find((a) => a.startsWith("--limit="));
const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : (args.includes("--one") ? 1 : 3);

const storeFilter = args.find((a) => a.startsWith("--store="))?.split("=")[1]?.toLowerCase();

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      return JSON.parse(fs.readFileSync(HISTORY_FILE, "utf8"));
    }
  } catch (e) {
    console.warn("⚠️ Не удалось прочитать историю публикаций, начинаем с пустого списка");
  }
  return { postedIds: [], history: [] };
}

function saveHistory(data) {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(HISTORY_FILE, JSON.stringify(data, null, 2), "utf8");
}

function escapeHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function stripHtml(text) {
  if (!text) return "";
  return String(text)
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function translit(input) {
  const MAP = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
    и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
    с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
    щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
  };
  const lower = String(input).toLowerCase().trim();
  let out = "";
  for (const ch of lower) {
    if (MAP[ch]) out += MAP[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += "-";
  }
  return out.replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
}

function formatDate(iso) {
  if (!iso) return "бессрочно";
  const str = String(iso).trim();
  const ru = str.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  let d = "", m = "", y = "";
  if (ru) {
    [, d, m, y] = ru;
  } else {
    const parts = str.split("-");
    if (parts.length === 3) {
      [y, m, d] = parts;
    } else {
      return str;
    }
  }
  const months = [
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря"
  ];
  const mi = Number(m) - 1;
  return `${Number(d)} ${months[mi] ?? m}`;
}

function formatPost(coupon) {
  const storeName = escapeHtml(coupon.store.name);
  const bonus = escapeHtml(stripHtml(coupon.promocode.bonusName) || "Скидка по промокоду");
  const code = escapeHtml(coupon.promocode.code);
  const terms = escapeHtml(stripHtml(coupon.promocode.terms));
  const region = escapeHtml(coupon.promocode.region);
  const expires = formatDate(coupon.promocode.expires);

  const lines = [];
  if (coupon.promocode.isHit) {
    lines.push(`🔥 <b>ХИТ! Скидка в ${storeName}</b>\n`);
  } else {
    lines.push(`🏷 <b>Скидка в ${storeName}</b>\n`);
  }

  lines.push(`<b>${bonus}</b>\n`);
  lines.push(`🎟 Промокод: <code>${code}</code> <i>(нажми, чтобы скопировать)</i>`);

  if (coupon.promocode.isFirstOrderOnly) {
    lines.push(`⚡️ <i>Только на первый заказ</i>`);
  } else if (coupon.promocode.isUniversal) {
    lines.push(`✨ <i>Для всех (на повторные заказы тоже)</i>`);
  }

  if (region && region !== "RU") {
    lines.push(`📍 Регион: ${region}`);
  }

  if (terms) {
    lines.push(`ℹ️ Условия: ${terms}`);
  }

  lines.push(`⏳ Срок действия: до ${expires}`);

  const ordText = escapeHtml(coupon.affiliate.ordText);
  const ordMarker = escapeHtml(coupon.affiliate.ordMarker);

  lines.push("\n────────────────────");
  if (ordText || ordMarker) {
    const markerStr = ordMarker ? ` erid: ${ordMarker}` : "";
    lines.push(`<tg-spoiler><i>${ordText}${markerStr}</i></tg-spoiler>`);
  } else {
    lines.push(`<tg-spoiler><i>Реклама.</i></tg-spoiler>`);
  }

  const affiliateUrl = coupon.affiliate.link || coupon.affiliate.landingLink || coupon.store.site;
  const storeUrl = `${SITE_URL}/store/${coupon.store.slug}`;

  const buttons = [
    [{ text: `🛒 В магазин ${coupon.store.name}`, url: affiliateUrl }],
    [{ text: `🌐 Все скидки ${coupon.store.name} на сайте`, url: storeUrl }]
  ];

  return { text: lines.join("\n"), buttons };
}

async function sendTelegramMessage(photoUrl, text, buttons) {
  const replyMarkup = {
    inline_keyboard: buttons.map((row) =>
      row.map((btn) => ({ text: btn.text, url: btn.url }))
    ),
  };

  let endpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  let body = {
    chat_id: CHANNEL_ID,
    text,
    parse_mode: "HTML",
    reply_markup: replyMarkup,
    disable_web_page_preview: false,
  };

  if (photoUrl && photoUrl.startsWith("http")) {
    endpoint = `https://api.telegram.org/bot${BOT_TOKEN}/sendPhoto`;
    body = {
      chat_id: CHANNEL_ID,
      photo: photoUrl,
      caption: text,
      parse_mode: "HTML",
      reply_markup: replyMarkup,
    };
  }

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  if (!data.ok && endpoint.includes("sendPhoto")) {
    // Fallback на текстовое сообщение
    const fallbackRes = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: CHANNEL_ID,
          text,
          parse_mode: "HTML",
          reply_markup: replyMarkup,
        }),
      }
    );
    return await fallbackRes.json();
  }
  return data;
}

// Извлечение и парсинг купонов
function parsePerfluenceData(rawJson) {
  const body = JSON.parse(rawJson);
  const items = Array.isArray(body.data) ? body.data : [];
  const coupons = [];
  let fallbackId = 1000;

  for (const raw of items) {
    const project = raw.project || raw.shop || raw;
    const name = (project.name || project.store_name || "Магазин").trim();
    const site = project.site || project.url || "";
    const logo = project.logo || project.logo_url || null;
    const slug = (project.slug || translit(name) || "magazin").trim();

    const groups = Array.isArray(raw.groups) ? raw.groups : [raw];
    for (const group of groups) {
      const promos = Array.isArray(group.promocodes) ? group.promocodes : [];
      for (const p of promos) {
        const links = Array.isArray(group.links_for_subscribers) ? group.links_for_subscribers : [];
        const landing = Array.isArray(group.landing) ? group.landing[0] : group.landing;
        const primaryLink = links[0]?.link || landing?.link || site;
        const ordMarker = p.ord_marker || landing?.ord_marker || "";
        const ordText = p.ord_custom_text || landing?.ord_custom_text || "";

        fallbackId++;
        coupons.push({
          id: p.id || fallbackId,
          promocode: {
            id: p.id || fallbackId,
            code: String(p.code || "").trim(),
            bonusName: (p.name || p.comment || "").trim(),
            terms: p.promo_terms || p.terms || null,
            expires: p.date || p.expires || null,
            isHit: Boolean(p.is_hit),
            isUniversal: Boolean(p.is_universal),
            isFirstOrderOnly: !Boolean(p.repeat_order),
            region: p.region_promo || p.region || null,
          },
          store: {
            name,
            slug,
            logo,
            site,
          },
          affiliate: {
            link: primaryLink,
            landingLink: landing?.link || primaryLink,
            ordMarker,
            ordText,
          },
        });
      }
    }
  }
  return coupons;
}

async function fetchCoupons() {
  if (!WIDGET_URL) {
    console.log("ℹ️ PERFLUENCE_WIDGET_URL не задан, загружаем мок-данные...");
    const mockFile = path.join(rootDir, "src", "lib", "mockCoupons.ts");
    if (fs.existsSync(mockFile)) {
      // Базовые тестовые данные
      return [
        {
          id: 16919143,
          promocode: {
            id: 16919143,
            code: "20AV1474",
            bonusName: "Скидка 20% от 1090 ₽ на первый заказ в Тануки",
            terms: "Действует на первый заказ в приложении и на сайте",
            expires: "2026-08-27",
            isHit: true,
            isUniversal: false,
            isFirstOrderOnly: true,
            region: "Москва, СПБ и др.",
          },
          store: {
            name: "TanukiFamily",
            slug: "tanukifamily",
            logo: "https://s3sc.perfluence.net/logos/17035947384036.png",
            site: "https://tanukifamily.ru",
          },
          affiliate: {
            link: "https://tanuki.prfl.me/smart_zakupka/rqxgcq",
            landingLink: "https://tanuki.prfl.me/smart_zakupka/rqxgcq",
            ordMarker: "2RanykMFSjm",
            ordText: 'Реклама. ООО "Корсика", ИНН 7730290633.',
          },
        },
      ];
    }
  }

  const res = await fetch(WIDGET_URL, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`Perfluence API error: ${res.status} ${res.statusText}`);
  const text = await res.text();
  const perfluenceCoupons = parsePerfluenceData(text);

  // Подгружаем ручные и Saleads купоны
  let customCoupons = [];
  try {
    const customFile = path.join(rootDir, "src", "lib", "customCoupons.ts");
    if (fs.existsSync(customFile)) {
      const content = fs.readFileSync(customFile, "utf8");
      // Извлекаем промокоды Плати по миру и Яндекса
      customCoupons = [
        {
          id: 50005,
          promocode: {
            id: 50005,
            code: "SALEADS2026",
            bonusName: "Скидка 500 ₽ на зарубежные карты (для подписок и путешествий)",
            terms: "Действует на выпуск виртуальной карты для оплаты зарубежных сервисов (ChatGPT, Steam, Spotify) и бронирования отелей.",
            expires: "2026-12-31",
            isHit: true,
            isUniversal: true,
            isFirstOrderOnly: false,
            region: "RU",
          },
          store: {
            name: "Плати по миру",
            slug: "plati-po-miru",
            logo: "https://platipomiru.com/favicon.ico",
            site: "https://platipomiru.com",
          },
          affiliate: {
            link: "https://my.saleads.pro/s/dz5lk?erid=2Vtzqwxtkav",
            landingLink: "https://my.saleads.pro/s/dz5lk?erid=2Vtzqwxtkav",
            ordMarker: "2Vtzqwxtkav",
            ordText: "Реклама.",
          },
        },
        {
          id: 50006,
          promocode: {
            id: 50006,
            code: "SALEADSPREM2026",
            bonusName: "Скидка 1 000 ₽ на Премиальную карту",
            terms: "Действует на выпуск Премиальной международной карты с повышенными лимитами.",
            expires: "2026-12-31",
            isHit: true,
            isUniversal: true,
            isFirstOrderOnly: false,
            region: "RU",
          },
        },
        {
          id: 50007,
          promocode: {
            id: 50007,
            code: "VKMESTA",
            bonusName: "Спецпредложения и скидки на авторские экскурсии по России",
            terms: "Бронирование авторских экскурсий и туров по городам и природе России от проверенных аттестованных гидов с бесплатной отменой за 48 часов.",
            expires: "2026-12-31",
            isHit: true,
            isUniversal: true,
            isFirstOrderOnly: false,
            region: "RU",
          },
          store: {
            name: "VK Места",
            slug: "vk-mesta",
            logo: "https://vkmesta.ru/favicon.ico",
            site: "https://vkmesta.ru",
          },
          affiliate: {
            link: "https://my.saleads.pro/s/7e6py?erid=2VtzqwtSSee",
            landingLink: "https://my.saleads.pro/s/7e6py?erid=2VtzqwtSSee",
            ordMarker: "2VtzqwtSSee",
            ordText: "Реклама.",
          },
        },
      ];
    }
  } catch (e) {}

  return [...perfluenceCoupons, ...customCoupons];
}

async function main() {
  const history = loadHistory();

  if (isListOnly) {
    console.log("📋 История опубликованных постов (для отчетов в Perfluence):\n");
    if (!history.history || history.history.length === 0) {
      console.log("Пока нет записей.");
      return;
    }
    history.history.forEach((h, idx) => {
      console.log(`${idx + 1}. [${h.store}] Код: ${h.code}`);
      console.log(`   🔗 Ссылка: ${h.postUrl || `https://t.me/smart_zakupka/${h.messageId}`}`);
      console.log(`   📅 Дата: ${h.date}\n`);
    });
    return;
  }

  console.log("🚀 Запуск Telegram Авто-постера ПромоФакт");
  console.log(`📌 Канал: ${CHANNEL_ID}`);
  console.log(`⚙️ Режим: ${isDryRun ? "DRY-RUN (без отправки)" : "LIVE"}`);
  if (isHitOnly) console.log("🔥 Фильтр: Только хиты");
  if (storeFilter) console.log(`🏪 Фильтр магазина: ${storeFilter}`);

  const coupons = await fetchCoupons();
  console.log(`📦 Всего доступно промокодов в API: ${coupons.length}`);

  const postedCodes = new Set(
    (history.history || [])
      .map((h) => h.code)
      .filter((code) => Boolean(code)),
  );

  let eligible = coupons.filter((c) => {
    if (!c.promocode.code) return false;
    if (isHitOnly && !c.promocode.isHit) return false;
    if (storeFilter && !c.store.slug.includes(storeFilter)) return false;
    if (!isForce && history.postedIds.includes(c.id)) return false;
    if (!isForce && postedCodes.has(c.promocode.code)) return false;
    return true;
  });

  // Приоритет: сначала хиты, потом свежие
  eligible.sort((a, b) => (b.promocode.isHit ? 1 : 0) - (a.promocode.isHit ? 1 : 0));

  const toPost = eligible.slice(0, limit);
  console.log(`🎯 Отобрано для публикации: ${toPost.length} (лимит: ${limit})`);

  if (toPost.length === 0) {
    console.log("✅ Все промокоды уже были опубликованы. Новых записей нет.");
    return;
  }

  for (const coupon of toPost) {
    const { text, buttons } = formatPost(coupon);
    console.log("\n═══════════════════════════════════════════════════════");
    console.log(`Пост для: [${coupon.store.name}] (ID: ${coupon.id})`);
    console.log("───────────────────────────────────────────────────────");
    console.log(text);
    console.log("Кнопки:", JSON.stringify(buttons, null, 2));
    console.log("═══════════════════════════════════════════════════════\n");

    if (isDryRun) {
      console.log("🔍 [DRY-RUN] Сообщение сформировано корректно (отправка пропущена).");
    } else {
      if (!BOT_TOKEN) {
        console.error("❌ ОШИБКА: TELEGRAM_BOT_TOKEN не указан в .env.local! Отправка невозможна.");
        process.exit(1);
      }

      console.log(`⏳ Отправка в ${CHANNEL_ID}...`);
      const result = await sendTelegramMessage(coupon.store.logo, text, buttons);

      if (result.ok) {
        const messageId = result.result?.message_id;
        const channelUsername = CHANNEL_ID.replace(/^@/, "");
        const postUrl = channelUsername.startsWith("-100")
          ? `https://t.me/c/${channelUsername.replace(/^-100/, "")}/${messageId}`
          : `https://t.me/${channelUsername}/${messageId}`;

        console.log(`✅ Успешно опубликовано! Message ID: ${messageId}`);
        console.log(`🔗 Прямая ссылка на пост для Perfluence:\n   👉 ${postUrl}`);
        console.log(`📌 Отправьте эту ссылку в кабинет Perfluence (проект: ${coupon.store.name})`);

        history.postedIds.push(coupon.id);
        history.history.push({
          id: coupon.id,
          code: coupon.promocode.code,
          store: coupon.store.name,
          storeSlug: coupon.store.slug,
          postUrl,
          date: new Date().toISOString(),
          messageId,
        });
        saveHistory(history);
      } else {
        console.error(`❌ Ошибка отправки:`, result.description || result);
      }

      // Небольшая задержка между отправками во избежание флуд-лимитов Telegram API
      await new Promise((r) => setTimeout(r, 2500));
    }
  }

  console.log("\n🎉 Завершено!");
}

main().catch((err) => {
  console.error("💥 Критическая ошибка:", err);
  process.exit(1);
});
