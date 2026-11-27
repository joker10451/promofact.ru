/**
 * scripts/hybrid-post-sources.mjs
 *
 * Гибридные источники контента и ротации для @smart_zakupka и VK:
 * 1) Единый реестр Pampadu (src/data/pampadu-offers.json) — одиночные карты и подборки.
 * 2) Свежие/неанонсированные статьи (/sovety) из generated-articles.json и articles.ts.
 * 3) Сезонные подборки (/collections/black-friday, /collections/finansy-i-karty).
 * 4) Умная ротация слотов, безопасная обрезка caption (<= 980 символов до ERID)
 *    и единая синхронизация истории (src/data/telegram-post-history.json).
 */

import fs from "node:fs";
import path from "node:path";

const SITE_URL = "https://promofact.ru";
const TG_HISTORY_PATH = path.join(process.cwd(), "src", "data", "telegram-post-history.json");
const PAMPADU_PATH = path.join(process.cwd(), "src", "data", "pampadu-offers.json");
const GENERATED_ARTICLES_PATH = path.join(process.cwd(), "src", "data", "generated-articles.json");
const STATIC_ARTICLES_PATH = path.join(process.cwd(), "src", "lib", "articles.ts");
const STABLE_STORES_PATH = path.join(process.cwd(), "src", "lib", "stableStores.ts");

export function getTgBotLink(startParam = "") {
  const username = (
    process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "SmartZakupkaPoster_bot"
  )
    .replace(/^@/, "")
    .trim();
  const base = `https://t.me/${username}`;
  if (!startParam) return base;
  const clean = String(startParam)
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 64);
  return clean ? `${base}?start=${clean}` : base;
}

function getMskDayKey(tsMs) {
  const mskDate = new Date(tsMs + 3 * 60 * 60 * 1000);
  return mskDate.toISOString().slice(0, 10);
}

/**
 * Жёсткий антиспам-гейт для автопостинга в @smart_zakupka:
 * ограничивает частоту публикаций (по умолчанию не чаще 1 раза в 3.5 ч
 * и не более 3 обычных постов в день МСК), чтобы канал не тонул и сохранял ERR.
 */
export function canAutoPostNow(
  history,
  {
    nowMs = Date.now(),
    minCooldownHours = Number(process.env.POST_TELEGRAM_COOLDOWN_HOURS || 3.5),
    maxPerDay = 3,
    isUrgentFlashDeal = false,
    force = false,
  } = {},
) {
  const list = Array.isArray(history) ? history : [];
  const todayKey = getMskDayKey(nowMs);

  let latestTs = 0;
  let postsToday = 0;
  for (const item of list) {
    const ts = Date.parse(item?.date || "");
    if (!Number.isFinite(ts) || ts > nowMs + 60_000) continue;
    if (ts > latestTs) latestTs = ts;
    if (getMskDayKey(ts) === todayKey) postsToday += 1;
  }

  const hoursSinceLast = latestTs > 0 ? (nowMs - latestTs) / 3_600_000 : 999;
  const effectiveCooldown = isUrgentFlashDeal ? Math.min(minCooldownHours, 1.5) : minCooldownHours;
  const effectiveMaxPerDay = isUrgentFlashDeal ? maxPerDay + 1 : maxPerDay;

  if (force) {
    return { allowed: true, reason: "Принудительный запуск (--force)", hoursSinceLast, postsToday };
  }
  if (postsToday >= effectiveMaxPerDay) {
    return {
      allowed: false,
      reason: `Достигнут дневной лимит постов (${postsToday}/${effectiveMaxPerDay} за ${todayKey} МСК)`,
      hoursSinceLast,
      postsToday,
    };
  }
  if (hoursSinceLast < effectiveCooldown) {
    return {
      allowed: false,
      reason: `Кулдаун между постами: прошло ${hoursSinceLast.toFixed(1)} ч из ${effectiveCooldown} ч`,
      hoursSinceLast,
      postsToday,
    };
  }
  return { allowed: true, reason: "OK", hoursSinceLast, postsToday };
}

const BANK_DISPLAY_NAMES = {
  "yandex-pay": "Яндекс Пэй",
  zenit: "Банк ЗЕНИТ",
  "otp-bank": "ОТП Банк",
  "t-bank": "Т-Банк",
  "alfa-bank": "Альфа-Банк",
};

const PAUSED_ARTICLE_SLUGS = new Set([
  "promokody-dodo-pizza",
]);

const PAUSED_STORE_PREFIXES = ["delimobil", "winlab"];

/**
 * Добавляет UTM-метки к собственным страницам `promofact.ru` для аналитики переходов.
 * Партнёрские ссылки (prfl.me, trk.ppdu.ru и др.) никогда не модифицируются.
 */
export function withUtm(url, source = "telegram", medium = "social", campaign = "") {
  if (!url || !String(url).startsWith(SITE_URL)) return url;
  const u = new URL(url);
  if (!u.searchParams.has("utm_source")) u.searchParams.set("utm_source", source);
  if (!u.searchParams.has("utm_medium")) u.searchParams.set("utm_medium", medium);
  if (campaign && !u.searchParams.has("utm_campaign")) {
    u.searchParams.set("utm_campaign", String(campaign).slice(0, 64));
  }
  return u.toString();
}

/**
 * Экранирование HTML-спецсимволов для Telegram HTML parse_mode.
 */
export function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Парсит дату окончания из форматов `DD.MM.YYYY`, `YYYY-MM-DD`, ISO.
 * Возвращает timestamp конца дня (МСК) или `null`, если дата не задана.
 */
export function parseExpiryMs(raw) {
  if (!raw || typeof raw !== "string") return null;
  const s = raw.trim();
  if (!s || /бессрочн|не указан/i.test(s)) return null;

  const ruMatch = s.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
  if (ruMatch) {
    const [, dd, mm, yyyy] = ruMatch;
    const ts = Date.parse(`${yyyy}-${mm}-${dd}T23:59:59+03:00`);
    return Number.isFinite(ts) ? ts : null;
  }

  const isoDateMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoDateMatch) {
    const ts = Date.parse(`${s}T23:59:59+03:00`);
    return Number.isFinite(ts) ? ts : null;
  }

  const parsed = Date.parse(s);
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Читает сопоставления id/name -> canonical slug из src/lib/stableStores.ts.
 */
export function loadStableStoreSlugs() {
  const byId = {};
  const byName = {};
  if (!fs.existsSync(STABLE_STORES_PATH)) return { byId, byName };

  const content = fs.readFileSync(STABLE_STORES_PATH, "utf8");
  const entryRe = /"([a-z0-9-]+)":\s*\{\s*[\s\S]*?id:\s*(\d+),[\s\S]*?slug:\s*"([a-z0-9-]+)",[\s\S]*?name:\s*"([^"]+)"/g;
  for (const m of content.matchAll(entryRe)) {
    const id = Number.parseInt(m[2], 10);
    const slug = m[3];
    const name = m[4].toLowerCase().trim();
    if (Number.isFinite(id) && slug) byId[id] = slug;
    if (name && slug) byName[name] = slug;
  }
  return { byId, byName };
}

/**
 * Обрезает текст по границе слова до maxLen символов без обрыва слова посередине.
 */
export function truncateAtWord(text, maxLen = 120) {
  const s = String(text || "").replace(/\s+/g, " ").trim();
  if (!s || maxLen <= 0) return "";
  if (s.length <= maxLen) return s;
  if (maxLen === 1) return s.slice(0, 1);

  const budget = maxLen - 1;
  let cut = s.slice(0, budget);
  const nextChar = s[budget] || "";
  const prevChar = cut.slice(-1);

  if (/[A-Za-zА-Яа-яЁё0-9]/.test(nextChar) && /[A-Za-zА-Яа-яЁё0-9]/.test(prevChar)) {
    const lastSpace = cut.search(/\s+\S*$/);
    if (lastSpace >= Math.floor(budget * 0.45)) {
      cut = cut.slice(0, lastSpace);
    }
  }

  cut = cut.replace(/[\s,.;:!?—-]+$/g, "").trim();
  return `${cut}…`;
}

/**
 * Считает видимую длину HTML-подписи после парсинга Telegram-тегов и HTML-сущностей
 * (Telegram Bot API ограничивает именно видимый текст sendPhoto caption до 1024 символов).
 */
export function visibleTelegramLength(html) {
  return String(html || "")
    .replace(/<[^>]*>/g, "")
    .replace(/&(?:#\d+|#x[0-9a-f]+|[a-z]+);/gi, "x")
    .length;
}

const VOID_OR_UNCLOSED_IGNORED = new Set(["br"]);

function closeUnclosedHtmlTags(html) {
  const stack = [];
  const tagRe = /<\/?([a-z][a-z0-9]*)(?:\s[^>]*)?>/gi;
  for (const m of html.matchAll(tagRe)) {
    const full = m[0];
    const tag = m[1].toLowerCase();
    if (VOID_OR_UNCLOSED_IGNORED.has(tag)) continue;
    if (full.startsWith("</")) {
      const idx = stack.lastIndexOf(tag);
      if (idx !== -1) stack.splice(idx, 1);
    } else if (!full.endsWith("/>")) {
      stack.push(tag);
    }
  }
  return html + stack.reverse().map((t) => `</${t}>`).join("");
}

function truncateHtmlByVisibleLen(html, maxVisibleLen) {
  const s = String(html || "");
  if (visibleTelegramLength(s) <= maxVisibleLen) return s;
  if (maxVisibleLen <= 1) return "";

  const target = maxVisibleLen - 1;
  let visibleCount = 0;
  let rawEnd = 0;
  let lastWordBoundaryRaw = -1;
  let inTag = false;

  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === "<") {
      inTag = true;
      continue;
    }
    if (inTag) {
      if (ch === ">") inTag = false;
      continue;
    }

    let stepRaw = 1;
    if (ch === "&") {
      const ent = s.slice(i).match(/^&(?:#\d+|#x[0-9a-f]+|[a-z]+);/i);
      if (ent) stepRaw = ent[0].length;
    }

    if (/\s/.test(ch)) {
      lastWordBoundaryRaw = i;
    }

    if (visibleCount + 1 > target) {
      rawEnd = i;
      break;
    }
    visibleCount += 1;
    rawEnd = i + stepRaw;
    i += stepRaw - 1;
  }

  let cut = s.slice(0, rawEnd);
  const nextRawChar = s[rawEnd] || "";
  if (
    lastWordBoundaryRaw > 0 &&
    /[A-Za-zА-Яа-яЁё0-9]/.test(nextRawChar) &&
    visibleCount >= 10
  ) {
    const candidate = s.slice(0, lastWordBoundaryRaw);
    if (visibleTelegramLength(candidate) >= Math.floor(target * 0.5)) {
      cut = candidate;
    }
  }

  cut = cut.replace(/<[^>]*$/, "").replace(/[\s,.;:!?—-]+$/g, "").trim();
  return closeUnclosedHtmlTags(`${cut}…`);
}

/**
 * Гарантирует, что подпись к `sendPhoto` не превысит `maxLen` видимых символов (по умолчанию 990)
 * и НИКОГДА не обрежет нижний блок с прямой ссылкой и обязательной маркировкой erid.
 * Сначала убирает опциональные строки целиком (не обрывая пункты списков посередине слова).
 */
export function fitCaption(bodyHtml, footerHtml, maxLen = 990) {
  const footer = String(footerHtml || "").trim();
  const body = String(bodyHtml || "").trim();
  const full = footer ? `${body}\n\n${footer}` : body;
  if (visibleTelegramLength(full) <= maxLen) return full;

  const lines = body.split("\n");
  while (lines.filter((l) => l.trim()).length > 2) {
    const currentBody = lines.join("\n").trim();
    const candidate = footer ? `${currentBody}\n\n${footer}` : currentBody;
    if (visibleTelegramLength(candidate) <= maxLen) return candidate;

    lines.pop();
    while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();
    while (
      lines.length > 1 &&
      /:<\/[bi]>\s*$|^[^<]*:\s*$/.test(lines[lines.length - 1].trim())
    ) {
      lines.pop();
      while (lines.length > 0 && !lines[lines.length - 1].trim()) lines.pop();
    }
  }

  const trimmedBody = lines.join("\n").trim();
  const afterDrop = footer ? `${trimmedBody}\n\n${footer}` : trimmedBody;
  if (visibleTelegramLength(afterDrop) <= maxLen) return afterDrop;

  const footerVisible = visibleTelegramLength(footer);
  const bodyBudget = Math.max(60, maxLen - footerVisible - (footer ? 2 : 0));
  const safeBody = truncateHtmlByVisibleLen(trimmedBody, bodyBudget);
  return footer ? `${safeBody}\n\n${footer}` : safeBody;
}

/**
 * Загружает единую историю публикаций канала `@smart_zakupka`.
 */
export function loadTgHistory() {
  try {
    if (!fs.existsSync(TG_HISTORY_PATH)) return [];
    const data = JSON.parse(fs.readFileSync(TG_HISTORY_PATH, "utf8"));
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

/**
 * Добавляет публикацию в `src/data/telegram-post-history.json`.
 */
export function recordTgHistory(entry) {
  const list = loadTgHistory();
  list.push(entry);
  // Держим последние 250 записей для компактности репозитория
  const trimmed = list.length > 250 ? list.slice(-250) : list;
  fs.mkdirSync(path.dirname(TG_HISTORY_PATH), { recursive: true });
  fs.writeFileSync(TG_HISTORY_PATH, JSON.stringify(trimmed, null, 2), "utf8");
  return trimmed;
}

/**
 * Классифицирует тип записи в telegram-post-history.json (`pampadu`, `article`, `perfluence`).
 */
export function classifyHistoryEntry(entry) {
  if (!entry) return "perfluence";
  const url = String(entry.url || "");
  const store = String(entry.store || "");
  if (entry.sourceType) return entry.sourceType;
  if (store.startsWith("digest-")) return "digest";
  if (url.includes("/sovety/")) return "article";
  if (
    store === "finance" ||
    store === "credit-cards" ||
    store === "debit-cards" ||
    Object.prototype.hasOwnProperty.call(BANK_DISPLAY_NAMES, store) ||
    url.includes("trk.ppdu.ru") ||
    url.includes("/collections/finansy-i-karty")
  ) {
    return "pampadu";
  }
  return "perfluence";
}

function daysSince(isoDate, nowMs) {
  const ts = Date.parse(isoDate || "");
  if (!Number.isFinite(ts)) return 999;
  return (nowMs - ts) / 86400000;
}

/**
 * Загружает офферы Pampadu и формирует кандидатов:
 * - Подборки карт (`credit-cards`, `debit-cards`)
 * - Одиночные высокодоходные офферы (`yandex-pay`, `zenit`, `otp-bank`, `t-bank`, `alfa-bank`)
 */
export function buildPampaduCandidates(history, nowMs = Date.now(), { force = false } = {}) {
  if (!fs.existsSync(PAMPADU_PATH)) return [];
  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(PAMPADU_PATH, "utf8"));
  } catch {
    return [];
  }

  const offers = Array.isArray(registry?.offers) ? registry.offers : [];
  const activeOffers = offers.filter((o) => {
    const exp = parseExpiryMs(o.expires);
    return exp === null || exp >= nowMs;
  });
  if (!activeOffers.length) return [];

  const candidates = [];

  // 1) Подборка кредитных / дебетовых карт (длинный структурированный HTML-дайджест)
  const creditOffers = activeOffers
    .filter((o) => o.productType === "credit")
    .sort((a, b) => (b.cpaRub || 0) - (a.cpaRub || 0));

  const lastRoundup = [...history]
    .reverse()
    .find((h) => h.store === "credit-cards" || h.store === "finance");
  const roundupAgeDays = lastRoundup ? daysSince(lastRoundup.date, nowMs) : 999;

  if (creditOffers.length >= 2 && (force || roundupAgeDays >= 4)) {
    const bullets = creditOffers.slice(0, 4).map((o, idx) => {
      const bank = BANK_DISPLAY_NAMES[o.storeSlug] || o.storeSlug;
      const topHighlight = o.highlights?.[0] || o.bonusName;
      return `${idx + 1}. <b><a href="${o.link}">${escapeHtml(bank)}</a></b> — ${escapeHtml(topHighlight)}`;
    });
    const eridFooter = creditOffers
      .slice(0, 4)
      .map((o) => o.ordText)
      .filter(Boolean)
      .join("\n");

    const text = [
      `💳 <b>Лучшие карты с длинным льготным периодом и кэшбэком (ноябрь 2026)</b>`,
      ``,
      `Собрали 4 проверенных предложения без скрытых комиссий, которые подходят под крупные покупки и распродажи:`,
      ``,
      ...bullets,
      ``,
      `📌 Совет: на покупках перед Новым годом беспроцентный период 120 дней или Сплит 0% позволяют сохранить скидку по промокоду и не замораживать всю сумму сразу.`,
      ``,
      `💬 <i>Какой формат карт вам выгоднее: длинная рассрочка (👍) или высокий кэшбэк на супермаркеты (🔥)?</i>`,
      ``,
      `👉 <a href="${withUtm(`${SITE_URL}/collections/finansy-i-karty`, "telegram", "social", "credit-cards")}">Сравнить условия всех карт на ПромоФакте →</a>`,
      ``,
      `⚖️ <i>${escapeHtml(eridFooter)}</i>`,
    ].join("\n");

    const buttons = [
      ...creditOffers.slice(0, 2).map((o) => [
        {
          text: `💳 Оформить ${BANK_DISPLAY_NAMES[o.storeSlug] || o.storeSlug}`,
          url: o.link,
        },
      ]),
      [{ text: "💼 Все карты и кэшбэк →", url: withUtm(`${SITE_URL}/collections/finansy-i-karty`, "telegram", "social", "credit-cards") }],
      [{ text: "🔍 Поиск промокодов по магазинам", url: getTgBotLink("src_channel_btn") }],
    ];

    candidates.push({
      kind: "pampadu",
      postMode: "message",
      storeSlug: "finansy-i-karty",
      storeName: "Банковские карты 2026",
      codes: creditOffers.slice(0, 4).map((o) => o.code),
      url: `${SITE_URL}/collections/finansy-i-karty`,
      affUrl: creditOffers[0].link,
      ordMarker: creditOffers.slice(0, 4).map((o) => o.ordMarker).join(", "),
      ordText: eridFooter,
      vkUrl: `${SITE_URL}/collections/finansy-i-karty`,
      vkTitle: "Подборка карт со 120 днями без % и кэшбэком на ПромоФакте",
      text,
      buttons,
      score: 95 + (roundupAgeDays > 7 ? 15 : 0),
    });
  }

  // 2) Одиночные банковские офферы (отсортированы по cpaRub + давности постинга)
  for (const o of activeOffers.sort((a, b) => (b.cpaRub || 0) - (a.cpaRub || 0))) {
    const lastSame = [...history]
      .reverse()
      .find(
        (h) =>
          (Array.isArray(h.codes) && h.codes.includes(o.code)) ||
          h.code === o.code ||
          h.store === o.storeSlug
      );
    const ageDays = lastSame ? daysSince(lastSame.date, nowMs) : 999;
    if (!force && ageDays < 6) continue;

    const bankName = BANK_DISPLAY_NAMES[o.storeSlug] || o.storeSlug;
    const bullets = (o.highlights || [])
      .slice(0, 3)
      .map((item) => `• ${escapeHtml(item)}`);
    const siteStoreUrl = `${SITE_URL}/store/${o.storeSlug}`;
    const tgSiteStoreUrl = withUtm(siteStoreUrl, "telegram", "social", o.storeSlug);

    const bodyPart = [
      `💳 <b>${escapeHtml(o.bonusName)}</b>`,
      ``,
      escapeHtml(o.terms),
      bullets.length ? `\n${bullets.join("\n")}` : null,
      ``,
      `💬 <i>Пользуетесь картой ${escapeHtml(bankName)} для кэшбэка на доставку? Делитесь опытом в комментариях 👇</i>`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const footerPart = [
      `👉 <a href="${o.link}">Оформить карту ${escapeHtml(bankName)} →</a>`,
      `🌐 <a href="${tgSiteStoreUrl}">Все предложения ${escapeHtml(bankName)}</a>`,
      ``,
      `⚖️ <i>${escapeHtml(o.ordText)}</i>`,
    ].join("\n");

    const text = fitCaption(bodyPart, footerPart, 960);

    candidates.push({
      kind: "pampadu",
      postMode: "photo",
      bannerSpec: {
        mode: "editorial",
        storeName: bankName,
        code: "",
        ctaLabel: "Условия банковской карты",
        ctaHint: o.serviceFee ? `Обслуживание: ${o.serviceFee}` : "Онлайн-оформление за пару минут",
        ctaPill: o.productType === "credit" ? "0% период →" : "Кэшбэк 0 ₽ →",
        bonus: o.bonusName,
        badgeText: "💳 ВЫГОДНАЯ КАРТА",
      },
      storeSlug: o.storeSlug,
      storeName: bankName,
      codes: [o.code],
      url: o.link,
      affUrl: o.link,
      ordMarker: o.ordMarker,
      ordText: o.ordText,
      vkUrl: withUtm(siteStoreUrl, "vk", "social", o.storeSlug),
      vkTitle: o.bonusName,
      text,
      buttons: [
        [{ text: `💳 Оформить ${bankName}`, url: o.link }],
        [{ text: `📋 Подробнее о карте на сайте`, url: tgSiteStoreUrl }],
        [{ text: "🔍 Найти промокод по магазину", url: getTgBotLink("src_channel_btn") }],
      ],
      score: Math.round((o.cpaRub || 1000) / 100) + Math.min(30, Math.round(ageDays)),
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Загружает статьи из `generated-articles.json` и `src/lib/articles.ts` для автоанонса.
 */
function loadAvailableArticles(nowMs = Date.now()) {
  const articles = [];
  const seen = new Set();

  if (fs.existsSync(GENERATED_ARTICLES_PATH)) {
    try {
      const gen = JSON.parse(fs.readFileSync(GENERATED_ARTICLES_PATH, "utf8"));
      if (Array.isArray(gen)) {
        for (const a of gen) {
          if (!a?.slug || seen.has(a.slug)) continue;
          seen.add(a.slug);
          articles.push({ ...a, isGenerated: true });
        }
      }
    } catch {}
  }

  if (fs.existsSync(STATIC_ARTICLES_PATH)) {
    const src = fs.readFileSync(STATIC_ARTICLES_PATH, "utf8");
    const marker = "const ARTICLES: Article[] = [";
    const start = src.indexOf(marker);
    if (start !== -1) {
      const slice = src.slice(start + marker.length);
      // Разделяем верхнеуровневые объекты по `slug: "..."`
      const slugMatches = [...slice.matchAll(/\n\s*slug:\s*"([^"]+)"/g)];
      for (let i = 0; i < slugMatches.length; i++) {
        const slug = slugMatches[i][1];
        if (seen.has(slug)) continue;
        seen.add(slug);
        const blockStart = slugMatches[i].index;
        const blockEnd = i + 1 < slugMatches.length ? slugMatches[i + 1].index : slice.length;
        const chunk = slice.slice(blockStart, blockEnd);

        const title = chunk.match(/\btitle:\s*"([^"]+)"/)?.[1] || "";
        const description =
          chunk.match(/\bdescription:\s*\r?\n?\s*"([^"]+)"/)?.[1] || "";
        const published = chunk.match(/\bpublished:\s*"([^"]+)"/)?.[1] || "";
        const publishAt = chunk.match(/\bpublishAt:\s*"([^"]+)"/)?.[1] || "";
        const ctaText = chunk.match(/ctaButton:\s*\{[\s\S]*?text:\s*"([^"]+)"/)?.[1];
        const ctaHref = chunk.match(/ctaButton:\s*\{[\s\S]*?href:\s*"([^"]+)"/)?.[1];

        if (title) {
          articles.push({
            slug,
            title,
            description,
            published,
            publishAt,
            ctaButton: ctaText && ctaHref ? { text: ctaText, href: ctaHref } : undefined,
            isGenerated: false,
            orderIdx: i,
          });
        }
      }
    }
  }

  const staleMentionRe = /до\s+\d{1,2}\.0[1-9]|до\s+\d{1,2}\s+(?:января|февраля|марта|апреля|мая|июня|июля|августа|сентября|октября)|в\s+(?:сентябре|октябре)\s+2026/i;

  return articles
    .filter((a) => {
      if (PAUSED_ARTICLE_SLUGS.has(a.slug)) return false;
      if (PAUSED_STORE_PREFIXES.some((p) => a.slug.includes(p))) return false;
      if (a.publishAt) {
        const pubMs = Date.parse(`${a.publishAt}:00+03:00`);
        if (Number.isFinite(pubMs) && pubMs > nowMs) return false;
      }
      // Исключаем устаревшие сезонные анонсы (напр., «до 30.09», «в октябре 2026»)
      if (staleMentionRe.test(`${a.title} ${a.description || ""}`)) return false;
      return true;
    })
    .sort((a, b) => {
      // Сначала автогенерированные свежие статьи, затем по дате `published` (новые первыми), затем последние добавленные в массив ARTICLES
      if (a.isGenerated !== b.isGenerated) return a.isGenerated ? -1 : 1;
      const aDate = a.published ? Date.parse(`${a.published}T00:00:00Z`) : 0;
      const bDate = b.published ? Date.parse(`${b.published}T00:00:00Z`) : 0;
      if (aDate !== bDate) return bDate - aDate;
      return (b.orderIdx || 0) - (a.orderIdx || 0);
    });
}

/**
 * Формирует кандидатов-анонсов новых статей `/sovety/[slug]` и сезонных подборок.
 */
export function buildArticleCandidates(history, nowMs = Date.now()) {
  const articles = loadAvailableArticles(nowMs);
  const postedUrls = new Set(history.map((h) => String(h.url || "")));
  const candidates = [];

  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    const url = `${SITE_URL}/sovety/${a.slug}`;
    const lastPosted = [...history]
      .reverse()
      .find((h) => String(h.url || "").includes(`/sovety/${a.slug}`) || h.store === a.slug);
    const ageDays = lastPosted ? daysSince(lastPosted.date, nowMs) : 999;

    // Уже постили за последние 14 дней — не дублируем
    if (ageDays < 14) continue;

    // Свежие сгенерированные или недавние статьи — в приоритете
    const ageSincePublish = a.published
      ? (nowMs - Date.parse(`${a.published}T12:00:00+03:00`)) / 86400000
      : 60;
    const isFresh = a.isGenerated || ageSincePublish <= 30 || !postedUrls.has(url);

    if (!isFresh && ageDays < 30) continue;

    const ctaHref =
      a.ctaButton?.href && a.ctaButton.href.startsWith("/")
        ? `${SITE_URL}${a.ctaButton.href}`
        : url;
    const tgArticleUrl = withUtm(url, "telegram", "social", a.slug);
    const tgCtaHref = withUtm(ctaHref, "telegram", "social", a.slug);

    const articleBody = [
      `📰 <b>${escapeHtml(a.title)}</b>`,
      ``,
      a.description ? escapeHtml(a.description) : null,
      ``,
      `💬 <i>Пробовали уже такой способ экономии? Поставьте реакцию и напишите в комментариях 👇</i>`,
    ]
      .filter((line) => line !== null)
      .join("\n");

    const articleFooter = [
      `👉 <a href="${tgArticleUrl}">Читать полный разбор и таблицу выгоды →</a>`,
      ctaHref !== url ? `🛍 <a href="${tgCtaHref}">Открыть актуальные промокоды по теме</a>` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const text = fitCaption(articleBody, articleFooter, 950);

    const buttons = [
      [{ text: "📖 Читать разбор →", url: tgArticleUrl }],
      ctaHref !== url
        ? [{ text: a.ctaButton?.text || "🛍 Промокоды по теме", url: tgCtaHref }]
        : [{ text: "🔍 Все магазины и скидки", url: withUtm(`${SITE_URL}/catalog`, "telegram", "social", a.slug) }],
      [{ text: "🔎 Найти код на свой магазин (бот)", url: getTgBotLink(`src_post_${a.slug}`) }],
    ];

    candidates.push({
      kind: "article",
      postMode: "photo",
      bannerPath: `${SITE_URL}/sovety/${a.slug}/opengraph-image`,
      storeSlug: a.slug,
      storeName: a.title.slice(0, 60),
      codes: [a.slug],
      url,
      affUrl: url,
      ordMarker: "",
      ordText: "",
      vkUrl: url,
      vkTitle: a.title,
      text,
      buttons,
      enableLinkPreview: false,
      score:
        (a.isGenerated ? 160 : 100) +
        (ageSincePublish <= 21 ? 45 : 0) +
        (lastPosted ? 0 : 25) +
        Math.max(0, 20 - i),
    });
  }

  // Сезонная подборка Чёрная Пятница / предновогодняя экономия, если давно не анонсировали
  const lastBf = [...history]
    .reverse()
    .find((h) => String(h.url || "").includes("/collections/black-friday"));
  const bfAge = lastBf ? daysSince(lastBf.date, nowMs) : 999;
  if (bfAge >= 5) {
    const bfUrl = `${SITE_URL}/collections/black-friday`;
    const tgBfUrl = withUtm(bfUrl, "telegram", "social", "black-friday");
    candidates.push({
      kind: "article",
      postMode: "photo",
      bannerSpec: {
        mode: "editorial",
        storeName: "Чёрная Пятница 2026",
        code: "",
        ctaLabel: "Подборка акций на сайте",
        ctaHint: "Магазины, условия и сроки в одном списке",
        ctaPill: "Все скидки →",
        bonus: "Промокоды + кэшбэк банков в одной подборке",
        badgeText: "🔥 ГЛАВНАЯ ПОДБОРКА",
      },
      storeSlug: "black-friday",
      storeName: "Чёрная Пятница 2026: сводный хаб скидок",
      codes: ["BLACKFRIDAY2026"],
      url: bfUrl,
      affUrl: bfUrl,
      ordMarker: "",
      ordText: "",
      vkUrl: bfUrl,
      vkTitle: "Чёрная Пятница 2026: рабочие промокоды и повышенные скидки",
      text: [
        `🔥 <b>Чёрная Пятница и предновогодние распродажи 2026: какие промокоды действуют сейчас</b>`,
        ``,
        `Мы собрали в одном разделе магазины с действующими кодами и флеш-акциями — от доставки продуктов до косметики, электроники и карт:`,
        ``,
        `• Живые коды с проверкой сроков действия`,
        `• Суммирование промокодов с кэшбэком и 0% рассрочкой`,
        `• Никаких устаревших купонов — только актуальная витрина`,
        ``,
        `💬 <i>Какой магазин ждёте на скидках больше всего? Пишите в комментах 👇</i>`,
        ``,
        `👉 <a href="${tgBfUrl}">Открыть хаб Чёрной Пятницы на ПромоФакте →</a>`,
      ].join("\n"),
      buttons: [
        [{ text: "🔥 Открыть все скидки распродажи →", url: tgBfUrl }],
        [{ text: "💳 Карты и кэшбэк 0%", url: withUtm(`${SITE_URL}/collections/finansy-i-karty`, "telegram", "social", "black-friday") }],
        [{ text: "🔎 Найти код по магазину", url: getTgBotLink("bf") }],
      ],
      enableLinkPreview: false,
      score: 95,
    });
  }

  return candidates.sort((a, b) => b.score - a.score);
}

/**
 * Формирует тематические вечерние/обеденные дайджесты по разделам сайта без утечки /sites/ ERID в ТГ.
 */
export function buildDigestCandidates(history, nowMs = Date.now(), { force = false } = {}) {
  const digests = [
    {
      slug: "digest-food-basket",
      pillLabel: "Продукты и доставка",
      title: "Обеденная корзина: скидки на доставку продуктов и еды сегодня",
      ctaHint: "Яндекс Лавка, Самокат, Пятёрочка и Перекрёсток в одном списке",
      ctaPill: "Открыть коды →",
      badgeText: "🛒 ПОДБОРКА ДНЯ",
      path: "/category/dostavka-produktov",
      botParam: "repeat",
      prompt: "Где сейчас чаще заказываете домой: Лавка 🔥 / Самокат 👍 / Пятёрочка ❤️?",
      bullets: [
        "Яндекс Лавка, Самокат, Пятёрочка, Перекрёсток и Магнит Доставка в одном списке",
        "Фильтр «На повторный заказ» — отдельно от кодов для новых клиентов",
        "Уведомления о новых кодах на любимые магазины — через бота в 1 клик",
      ],
    },
    {
      slug: "digest-repeat-orders",
      pillLabel: "На повторный заказ",
      title: "Промокоды на повторный заказ: подборка для постоянных покупателей",
      ctaHint: "Отдельный раздел без купонов «только для новичков»",
      ctaPill: "Все повторные →",
      badgeText: "🔁 ДЛЯ ВСЕХ",
      path: "/collections/povtornyy-zakaz",
      botParam: "repeat",
      prompt: "На какие магазины разобрать повторные заказы завтра? Напишите бренд 👇",
      bullets: [
        "Не тратьте время на подбор кодов «только для новичков»",
        "Собрали бренды с действующими скидками для постоянных покупателей",
        "Подписывайтесь на конкретный магазин в боте — пришлём алерт при обновлении",
      ],
    },
    {
      slug: "digest-new-year-2027",
      pillLabel: "Новый Год 2027",
      title: "Новогодний гид 2027: подарки, праздничный стол и поездки со скидками",
      ctaHint: "Подарки, косметика, маркетплейсы, продукты и отели",
      ctaPill: "К подборке →",
      badgeText: "🎄 К ПРАЗДНИКАМ",
      path: "/collections/novyy-god-2027",
      botParam: "src_digest_ny2027",
      prompt: "Что закупаете заранее к Новому году: подарки 🔥 или стол и продукты 👍?",
      bullets: [
        "Проверенные акции на подарки, парфюмерию, одежду и технику",
        "Доставка продуктов к празднику и бронирование отелей на каникулы",
        "Быстрый поиск промокода по любому бренду в нашем боте",
      ],
    },
    {
      slug: "digest-beauty-and-home",
      pillLabel: "Красота, аптеки и кино",
      title: "Вечерний дайджест выгоды: бьюти, подписки и товары для дома",
      ctaHint: "Косметика, маркетплейсы и онлайн-кинотеатры без просрочек",
      ctaPill: "Смотреть топ →",
      badgeText: "✨ ЛУЧШЕЕ ЗА ДЕНЬ",
      path: "/category/kosmetika-i-parfyumeriya",
      botParam: "src_digest_beauty",
      prompt: "Какие подборки выходят полезнее: продукты 🔥 или косметика/техника ⚡?",
      bullets: [
        "Актуальные акции на косметику, товары для дома и онлайн-кинотеатры",
        "Живые сроки действия без просроченных купонов",
        "Мгновенный поиск по 50+ брендам в нашем Telegram-боте",
      ],
    },
  ];

  const out = [];
  for (let i = 0; i < digests.length; i += 1) {
    const d = digests[i];
    const lastSame = [...history].reverse().find((h) => h.store === d.slug);
    const ageDays = lastSame ? daysSince(lastSame.date, nowMs) : 999;
    if (!force && ageDays < 5) continue;

    const targetUrl = `${SITE_URL}${d.path}`;
    const tgTargetUrl = withUtm(targetUrl, "telegram", "social", d.slug);
    const body = [
      `🔥 <b>${escapeHtml(d.title)}</b>`,
      ``,
      ...d.bullets.map((b) => `• ${escapeHtml(b)}`),
      ``,
      `💬 <i>${escapeHtml(d.prompt)}</i>`,
    ].join("\n");
    const footer = [
      `🌐 <a href="${tgTargetUrl}">Открыть подборку на ПромоФакте →</a>`,
      `🤖 <a href="${getTgBotLink(d.botParam)}">Быстрый поиск в боте по любому магазину →</a>`,
    ].join("\n");

    out.push({
      kind: "digest",
      postMode: "photo",
      bannerSpec: {
        mode: "editorial",
        storeName: d.pillLabel,
        code: "",
        ctaLabel: "Раздел на ПромоФакте",
        ctaHint: d.ctaHint,
        ctaPill: d.ctaPill,
        bonus: d.title,
        badgeText: d.badgeText,
      },
      storeSlug: d.slug,
      storeName: d.title.slice(0, 60),
      codes: [],
      url: targetUrl,
      affUrl: targetUrl,
      ordMarker: "",
      ordText: "",
      vkUrl: targetUrl,
      vkTitle: d.title,
      text: fitCaption(body, footer, 950),
      buttons: [
        [{ text: "🔍 Найти коды на повторные заказы (бот)", url: getTgBotLink(d.botParam) }],
        [{ text: "🌐 Смотреть подборку на сайте →", url: tgTargetUrl }],
      ],
      enableLinkPreview: false,
      score: 105 + Math.min(30, Math.round(ageDays)) - i,
    });
  }

  return out.sort((a, b) => b.score - a.score);
}

/**
 * Выбирает трек публикации (`perfluence`, `pampadu`, `digest` или `article`) с учётом `--mode`,
 * времени суток (вечерний пик 18:00–21:00 МСК) и истории последних постов.
 */
export function selectHybridTrack({
  mode = "auto",
  hasPerfluenceCandidate,
  hasUrgentFlashDeal,
  hasPampaduCandidate,
  hasArticleCandidate,
  hasDigestCandidate = false,
  history,
  nowDate = new Date(),
}) {
  if (mode === "perfluence") return hasPerfluenceCandidate ? "perfluence" : null;
  if (mode === "pampadu") return hasPampaduCandidate ? "pampadu" : null;
  if (mode === "article") return hasArticleCandidate ? "article" : null;
  if (mode === "digest") return hasDigestCandidate ? "digest" : null;

  // --mode=auto
  const lastTwo = history.slice(-2).map(classifyHistoryEntry);
  const lastType = lastTwo[lastTwo.length - 1] || null;
  const bothPerfluence = lastTwo.length === 2 && lastTwo[0] === "perfluence" && lastTwo[1] === "perfluence";

  // Если Perfluence пуст (нет одобренных для @smart_zakupka), переключаемся на Дайджест / Pampadu / Статьи
  if (!hasPerfluenceCandidate) {
    if (lastType !== "digest" && hasDigestCandidate) return "digest";
    if (lastType === "pampadu" && hasArticleCandidate) return "article";
    if (hasPampaduCandidate) return "pampadu";
    if (hasArticleCandidate) return "article";
    if (hasDigestCandidate) return "digest";
    return null;
  }

  // Горячие флеш-акции всегда идут в первую очередь
  if (hasUrgentFlashDeal) return "perfluence";

  // Вечерний пик 18:00–21:00 МСК: чередуем дайджесты, статьи, финансы и ритейл
  const mskHour = (nowDate.getUTCHours() + 3) % 24;
  const isEveningPeak = mskHour >= 18 && mskHour <= 21;

  if (bothPerfluence || (isEveningPeak && lastType === "perfluence")) {
    if (lastType !== "digest" && hasDigestCandidate) return "digest";
    if (lastType !== "article" && hasArticleCandidate) return "article";
    if (hasPampaduCandidate) return "pampadu";
    if (hasArticleCandidate) return "article";
  }

  return "perfluence";
}
