/**
 * scripts/generate-article.mjs
 *
 * Автономная фабрика SEO/Дзен-статей PromoFact на базе Gemini API.
 * Расписание по слотам:
 *   - Пн (--slot=retail): топ-магазин с активными кодами, у которого ещё нет разбора в /sovety
 *   - Ср (--slot=finance): банковские карты, кэшбэк и рассрочка из Pampadu / Perfluence
 *   - Пт (--slot=seasonal): сезонный/мультибрендовый гайд (Чёрная Пятница, Новый год, подарки)
 *
 * Все тексты строго заземлены на живые данные (Pampadu + Perfluence), соблюдают
 * правила несовместимости рекламодателей (publisherPlacementRules), список 410 Gone
 * и политику честных формулировок (test:seo-truthful).
 *
 * Использование:
 *   node scripts/generate-article.mjs --slot=auto --dry-run
 *   node scripts/generate-article.mjs --slot=retail
 */

import fs from "node:fs";
import path from "node:path";
import { requestJson } from "./http-client.mjs";
import { parseExpiryMs } from "./hybrid-post-sources.mjs";

const ROOT = process.cwd();
const GENERATED_PATH = path.join(ROOT, "src", "data", "generated-articles.json");
const PAMPADU_PATH = path.join(ROOT, "src", "data", "pampadu-offers.json");
const FEED_PATH = path.join(ROOT, "src", "data", "perfluence-feed.json");
const ARTICLES_TS_PATH = path.join(ROOT, "src", "lib", "articles.ts");
const GONE_TS_PATH = path.join(ROOT, "src", "lib", "goneArticles.ts");
const STABLE_STORES_PATH = path.join(ROOT, "src", "lib", "stableStores.ts");
const COLLECTIONS_PATH = path.join(ROOT, "src", "lib", "collections.ts");
const TAXONOMY_PATH = path.join(ROOT, "src", "lib", "categoryTaxonomy.ts");

const GEMINI_MODELS = [
  "gemini-3-flash-preview",
  "gemini-3.8-flash",
  "gemini-flash-lite-latest",
];

// Паузы и непригодные к совместному продвижению пары из publisherPlacementRules / publisherPauses
const EXCLUDED_STORES = new Set([
  "delimobil",
  "winlab",
  "dodo-pizza",
  "flor2u",
]);

const CO_PROMO_CONFLICTS = [
  { groupA: ["tanuki", "tanukifamily"], groupB: ["farfor", "yobidoyobi"] },
  { groupA: ["yandeks-tsvety"], groupB: ["flowwow", "fmart"] },
  { groupA: ["flor2u"], groupB: ["fmart"] },
  { groupA: ["goldapple", "zolotoe-yabloko"], groupB: ["letual"] },
  { groupA: ["cozy-home"], groupB: ["carte-blanche", "carteblanche"] },
  { groupA: ["pyaterochka"], groupB: ["vkusvill-dostavka", "samokat", "kuper", "globus"] },
];

const BANNED_CLAIM_RE = /скидка\s+применится\s+сразу|гарантир|100\s*%\s*сработа|работает\s+у\s+всех|точные\s+даты\s+заранее|бессрочн[а-яё]*\s+промокод/i;
const HTML_TAG_RE = /<\/?[a-z][\s\S]*?>/i;
const BAD_BRAND_RE = /admitad|адмитад/i;

function loadEnvLocal() {
  const envPath = path.join(ROOT, ".env.local");
  const out = {};
  if (!fs.existsSync(envPath)) return out;
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    out[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return out;
}

function getEnv(name, fileEnv) {
  return (process.env[name] || fileEnv[name] || "").trim();
}

function loadStableStores() {
  const stores = [];
  const bySlug = new Map();
  if (!fs.existsSync(STABLE_STORES_PATH)) return { stores, bySlug };
  const text = fs.readFileSync(STABLE_STORES_PATH, "utf8");
  const re =
    /"([a-z0-9-]+)":\s*\{\s*[\s\S]*?id:\s*(-?\d+),[\s\S]*?slug:\s*"([a-z0-9-]+)",[\s\S]*?name:\s*"([^"]+)",[\s\S]*?category:\s*"([^"]+)",[\s\S]*?categorySlug:\s*"([a-z0-9-]+)"/g;
  for (const m of text.matchAll(re)) {
    const store = {
      id: Number.parseInt(m[2], 10),
      slug: m[3],
      name: m[4],
      category: m[5],
      categorySlug: m[6],
    };
    stores.push(store);
    bySlug.set(store.slug, store);
  }
  return { stores, bySlug };
}

function loadCollectionSlugs() {
  const slugs = new Set(["black-friday", "finansy-i-karty", "first-order", "food-delivery", "tsvety-i-podarki"]);
  if (!fs.existsSync(COLLECTIONS_PATH)) return slugs;
  const text = fs.readFileSync(COLLECTIONS_PATH, "utf8");
  for (const m of text.matchAll(/\bslug:\s*"([a-z0-9-]+)"/g)) {
    slugs.add(m[1]);
  }
  return slugs;
}

function loadCategorySlugs() {
  const slugs = new Set();
  if (!fs.existsSync(TAXONOMY_PATH)) return slugs;
  const text = fs.readFileSync(TAXONOMY_PATH, "utf8");
  const start = text.indexOf("export const CATEGORIES");
  const end = text.indexOf("export const CATEGORY_GROUPS");
  const block = start !== -1 ? text.slice(start, end > start ? end : text.length) : text;
  for (const m of block.matchAll(/\{\s*slug:\s*"([a-z0-9-]+)"/g)) {
    slugs.add(m[1]);
  }
  return slugs;
}

function loadGoneSlugs() {
  const gone = new Set();
  if (!fs.existsSync(GONE_TS_PATH)) return gone;
  const text = fs.readFileSync(GONE_TS_PATH, "utf8");
  for (const m of text.matchAll(/"([a-z0-9-]+)"/g)) {
    gone.add(m[1]);
  }
  return gone;
}

function loadExistingArticles() {
  const slugs = new Set();
  const titles = [];
  if (fs.existsSync(ARTICLES_TS_PATH)) {
    const text = fs.readFileSync(ARTICLES_TS_PATH, "utf8");
    const marker = "const ARTICLES: Article[] = [";
    const start = text.indexOf(marker);
    const body = start !== -1 ? text.slice(start + marker.length) : text;
    for (const m of body.matchAll(/\n\s*slug:\s*"([^"]+)"/g)) slugs.add(m[1]);
    for (const m of body.matchAll(/\n\s*title:\s*"([^"]+)"/g)) titles.push(m[1]);
  }
  let generated = [];
  if (fs.existsSync(GENERATED_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(GENERATED_PATH, "utf8"));
      if (Array.isArray(parsed)) generated = parsed;
    } catch {}
  }
  for (const a of generated) {
    if (a?.slug) slugs.add(a.slug);
    if (a?.title) titles.push(a.title);
  }
  return { slugs, titles, generated };
}

function loadPampaduOffers(nowMs) {
  if (!fs.existsSync(PAMPADU_PATH)) return [];
  try {
    const reg = JSON.parse(fs.readFileSync(PAMPADU_PATH, "utf8"));
    return (reg.offers || []).filter((o) => {
      const exp = parseExpiryMs(o.expires);
      return exp === null || exp >= nowMs;
    });
  } catch {
    return [];
  }
}

async function loadActivePerfluenceByStore(widgetUrl, storesMeta, nowMs) {
  let rawProjects = [];
  if (widgetUrl) {
    try {
      const res = await requestJson(widgetUrl, { timeoutMs: 25000 });
      if (res.ok && Array.isArray(res.json?.data)) {
        rawProjects = res.json.data;
      }
    } catch (err) {
      console.warn("[generate-article] Не удалось загрузить live PERFLUENCE_WIDGET_URL, используем локальный фид:", err.message);
    }
  }
  if (!rawProjects.length && fs.existsSync(FEED_PATH)) {
    try {
      const feed = JSON.parse(fs.readFileSync(FEED_PATH, "utf8"));
      if (Array.isArray(feed?.data)) rawProjects = feed.data;
    } catch {}
  }

  const byId = new Map(storesMeta.stores.map((s) => [s.id, s]));
  const storeOffers = new Map();

  for (const item of rawProjects) {
    const proj = item.project || item;
    const pid = Number(proj.id || proj.project_id);
    const meta = byId.get(pid);
    if (!meta || EXCLUDED_STORES.has(meta.slug)) continue;

    const promos = [];
    for (const grp of item.groups || []) {
      for (const p of grp.promocodes || []) {
        if (!p.code) continue;
        if (String(p.group || "").toLowerCase() === "admitad") continue;
        const expMs = parseExpiryMs(p.date || "");
        if (expMs !== null && expMs < nowMs) continue;
        promos.push({
          code: String(p.code).trim(),
          title: String(p.comment || p.name || "").replace(/\s+/g, " ").trim(),
          expires: p.date || "",
          repeatOrder: Boolean(p.repeat_order),
        });
      }
    }

    if (promos.length > 0) {
      storeOffers.set(meta.slug, {
        ...meta,
        activeBloggers: proj.activeBloggers || 1000,
        promos: promos.slice(0, 6),
      });
    }
  }

  return storeOffers;
}

function hasCoPromoConflict(slugs) {
  const set = new Set(slugs);
  for (const rule of CO_PROMO_CONFLICTS) {
    const aHit = rule.groupA.some((s) => set.has(s));
    const bHit = rule.groupB.some((s) => set.has(s));
    if (aHit && bHit) return `${rule.groupA[0]} + ${rule.groupB[0]}`;
  }
  return null;
}

function isCompatibleWithSelected(selectedSet, candidateSlug) {
  const test = [...selectedSet, candidateSlug];
  return !hasCoPromoConflict(test);
}

function resolveSlot(requestedSlot, generatedArticles, nowDate) {
  if (requestedSlot && requestedSlot !== "auto") return requestedSlot;
  // Московский день недели: Пн(1)=retail, Ср(3)=finance, Пт(5)=seasonal
  const mskDate = new Date(nowDate.getTime() + 3 * 3600 * 1000);
  const day = mskDate.getUTCDay();
  if (day === 1) return "retail";
  if (day === 3) return "finance";
  if (day === 5) return "seasonal";

  // В остальные дни выбираем наименее частый / не последний тип
  const lastSlot = generatedArticles[0]?._slot;
  if (lastSlot === "retail") return "finance";
  if (lastSlot === "finance") return "seasonal";
  return "retail";
}

function pickTopicBrief({ slot, storeOffers, pampaduOffers, existingSlugs, existingTitles, mskYmd }) {
  const titleJoined = existingTitles.join(" ").toLowerCase();

  if (slot === "retail") {
    const candidates = [...storeOffers.values()]
      .filter((s) => {
        if (s.categorySlug === "finansy" || (s.categorySlug === "servisy-i-podpiski" && /bank|sber|t-bank|alfa|zenit|otp/.test(s.slug))) return false;
        const candidateSlug = `promokody-${s.slug}`;
        if (existingSlugs.has(candidateSlug)) return false;
        // Проверяем, нет ли уже отдельного обзорного гайда про этот бренд
        const shortName = s.name.toLowerCase().replace(/доставка|онлайн/g, "").trim();
        if (
          [...existingSlugs].some((sl) => sl.startsWith("promokody-") && sl.includes(s.slug)) ||
          (shortName.length >= 4 && existingTitles.some((t) => t.toLowerCase().startsWith(`промокоды ${shortName}`)))
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => (b.promos.length * 100 + (b.activeBloggers || 0) / 100) - (a.promos.length * 100 + (a.activeBloggers || 0) / 100));

    const chosen = candidates[0] || [...storeOffers.values()][0];
    if (!chosen) {
      throw new Error("Нет активных ритейл-магазинов в Perfluence для генерации обзора");
    }

    const compatiblePeers = [...storeOffers.values()]
      .filter((p) => p.slug !== chosen.slug && p.categorySlug === chosen.categorySlug && isCompatibleWithSelected([chosen.slug], p.slug))
      .slice(0, 2);

    return {
      slot: "retail",
      suggestedSlug: `promokody-${chosen.slug}-gayd-2026`,
      primaryStoreSlug: chosen.slug,
      targetStores: [chosen.slug],
      ctaDefault: { text: `Все промокоды ${chosen.name} →`, href: `/store/${chosen.slug}` },
      factsBlock: [
        `Главный бренд: ${chosen.name} (/store/${chosen.slug}), категория: ${chosen.category} (/category/${chosen.categorySlug}).`,
        `Проверенные живые промокоды/акции прямо сейчас:`,
        ...chosen.promos.map((p) => `  - Код "${p.code}": ${p.title} (срок: ${p.expires || "актуальный"}, тип: ${p.repeatOrder ? "подходит для повторных заказов" : "только первый заказ"})`),
        compatiblePeers.length
          ? `Допустимые смежные магазины в той же категории для перелинковки: ${compatiblePeers.map((p) => `${p.name} (/store/${p.slug})`).join(", ")}.`
          : "",
      ].filter(Boolean).join("\n"),
      angleHint: `Напиши подробный практический гайд по экономии в ${chosen.name} в конце ноября / начале зимы 2026: разбери реальную арифметику выбора промокода под разный размер корзины (если есть процентные и фиксированные коды — посчитай точку выгоды), условия первого/повторного заказа, минимальный чек и честное суммирование с банковским кэшбэком. Запрещено ссылаться на магазины вне списка!`,
    };
  }

  if (slot === "finance") {
    const financeAngles = [
      {
        slug: "debetovye-karty-s-besplatnym-obsluzhivaniem-i-keshbekom-2026",
        topic: "Дебетовые карты с бесплатным обслуживанием навсегда и максимальным кэшбэком для покупок с промокодами в 2026 году",
        focus: "debit",
      },
      {
        slug: "kreditka-ili-rassrochka-kak-oplachivat-krupnye-pokupki-2026",
        topic: "Льготный период 120 дней против рассрочки 0% (Сплит и Платинум): как правильно покупать по промокодам без переплат",
        focus: "credit",
      },
      {
        slug: "keshbek-bankov-i-promokody-kak-skladyvat-skidki-2026",
        topic: "Как легально сочетать промокоды магазинов с банковским кэшбэком и льготным периодом до 120 дней в 2026 году",
        focus: "all",
      },
    ];
    const picked = financeAngles.find((a) => !existingSlugs.has(a.slug) && !titleJoined.includes(a.slug.slice(0, 12))) || {
      slug: `finansy-karty-keshbek-${mskYmd.slice(0, 7)}`,
      topic: `Банковские карты и кэшбэк-связки под зимние покупки 2026–2027`,
      focus: "all",
    };

    const usedOffers = pampaduOffers.filter((o) => picked.focus === "all" || o.productType === picked.focus);
    const bankLines = (usedOffers.length ? usedOffers : pampaduOffers).map(
      (o) => `  - Карта (/store/${o.storeSlug}): ${o.bonusName}. Условия: ${o.terms}. Преимущества: ${(o.highlights || []).join("; ")}.`,
    );

    return {
      slot: "finance",
      suggestedSlug: picked.slug,
      primaryStoreSlug: "finansy-i-karty",
      targetStores: [...new Set((usedOffers.length ? usedOffers : pampaduOffers).map((o) => o.storeSlug))],
      ctaDefault: { text: "Сравнить карты и кэшбэк →", href: "/collections/finansy-i-karty" },
      factsBlock: [
        `Тема статьи: ${picked.topic}`,
        `Проверенные финансовые продукты партнёров на promofact.ru:`,
        ...bankLines,
        `Раздел подборки на сайте: /collections/finansy-i-karty.`,
      ].join("\n"),
      angleHint: `Напиши практический финансовый разбор с конкретными цифрами и расчётами на реальных корзинах (например, заказ на 5 000 ₽ или покупка техники на 35 000 ₽). Объясни нюансы грейс-периода (когда снимать наличные нельзя, почему важно вносить минимальный платёж вовремя и как работает кэшбэк от оплаченной суммы). Без рекламы кредитных рисков, максимально объективно и полезно для читателя Дзена и Поиска.`,
    };
  }

  // slot === "seasonal"
  const month = Number(mskYmd.slice(5, 7));
  const isNov = month === 11;
  const themeTitle = isNov
    ? "Киберпонедельник и подготовка к Новому году 2027: на какие магазины уже действуют промокоды в конце ноября"
    : "Зимние покупки и подарки к Новому году 2027: как сэкономить с проверенными промокодами";
  const slugBase = isNov
    ? `kiberponedelnik-novyy-god-skidki-${mskYmd.slice(0, 7)}`
    : `podarki-novyy-god-promokody-${mskYmd.slice(0, 7)}`;

  // Собираем совместимый безконфликтный список до 5 топ-магазинов
  const pickedStores = [];
  for (const s of [...storeOffers.values()].sort((a, b) => (b.activeBloggers || 0) - (a.activeBloggers || 0))) {
    if (pickedStores.length >= 5) break;
    if (!isCompatibleWithSelected(pickedStores.map((x) => x.slug), s.slug)) continue;
    pickedStores.push(s);
  }

  return {
    slot: "seasonal",
    suggestedSlug: existingSlugs.has(slugBase) ? `${slugBase}-${mskYmd.slice(8, 10)}` : slugBase,
    primaryStoreSlug: pickedStores[0]?.slug || "black-friday",
    targetStores: pickedStores.map((s) => s.slug),
    ctaDefault: { text: "Все акции распродаж 2026 →", href: "/collections/black-friday" },
    factsBlock: [
      `Сезонный гайд: ${themeTitle}`,
      `Проверенные активные магазины (совместимы друг с другом, без конфликтных пар):`,
      ...pickedStores.map(
        (s) =>
          `  - ${s.name} (/store/${s.slug}, ${s.category}): коды ${s.promos.slice(0, 2).map((p) => `${p.code} (${p.title}, до ${p.expires || "уточняется"})`).join(" | ")}`,
      ),
      `Также доступны финансовые карты рассрочки/кэшбэка (/collections/finansy-i-karty) и хаб распродажи (/collections/black-friday).`,
    ].join("\n"),
    angleHint: `Напиши живую, структурированную предновогоднюю/сезонную подборку-гайд: как распределить бюджет на подарки, еду к столу, косметику и технику заранее, используя проверенные промокоды. Покажи примеры расчёта экономии в рублях и напомни, что сроки и пороги могут обновляться перед праздниками.`,
  };
}

function buildGeminiPrompt({ brief, validStoreSlugs, validCategorySlugs, validCollectionSlugs, existingSlugs, mskYmd }) {
  return `Ты — старший редактор и SEO-аналитик сервиса PromoFact (promofact.ru).
Напиши экспертную, честную, практичную статью на русском языке для раздела /sovety (публикуется в поиске Яндекса/Google и в ленте Дзена).

ДАТА ВЫХОДА: ${mskYmd}

ФАКТИЧЕСКАЯ БАЗА (ИСПОЛЬЗУЙ ТОЛЬКО ЭТИ ДАННЫЕ, НЕ ВЫДУМЫВАЙ КОДЫ И ПРОЦЕНТЫ):
${brief.factsBlock}

ЗАДАНИЕ ПО ТЕМЕ И СТРУКТУРЕ:
${brief.angleHint}

ЖЁСТКИЕ ТРЕБОВАНИЯ:
1. Никаких HTML-тегов в тексте (разрешён только **жирный** шрифт в абзацах \`body\` и заголовки второго уровня начинающиеся строго с \`## \`).
2. Никакой ложной гарантированности и стоп-слов: СТРОГО ЗАПРЕЩЕНЫ любые однокоренные слова с корнем «гарантир» (гарантия, гарантированный, гарантировано, гарантирует, гарантируем — даже с частицей «не»!), а также «скидка применится сразу», «100% сработает», «работает у всех», «точные даты заранее», «промокод бессрочный» и любые упоминания Admitad / Адмитад. Вместо «гарантированный» пиши «подтверждённый», «постоянный» или «при соблюдении условий». Всегда честно указывай про пороги и условия проверки в корзине/банке.
3. Длина \`body\`: от 11 до 16 насыщенных абзацев (включая 4–5 подзаголовков вида \`## Заголовок раздела\`). Средний объём статьи — 3500–5500 символов полезного текста с примерами расчётов в рублях (₽).
4. \`slug\`: предложи латинский URL-slug (только строчные буквы a-z, цифры 0-9 и дефис \`-\`, желательно \`${brief.suggestedSlug}\`), НЕ совпадающий ни с одним уже существующим (${[...existingSlugs].slice(0, 20).join(", ")}...).
5. \`title\`: цепляющий, конкретный заголовок 45–88 символов без эмодзи (удобен и для обложки 1200×630, и для SEO).
6. \`description\`: лаконичный сниппет 115–160 символов.
7. \`faq\`: 4 честных практических вопроса и ответа (\`q\`, \`a\`).
8. \`related\`: 4–5 внутренних ссылок ТОЛЬКО из этих разрешённых форматов и существующих URL:
   - Магазины: ${brief.targetStores.map((s) => `/store/${s}`).join(", ")} (или другие допустимые: ${[...validStoreSlugs].slice(0, 18).join(", ")})
   - Подборки: ${[...validCollectionSlugs].map((c) => `/collections/${c}`).join(", ")}
   - Категории: ${[...validCategorySlugs].slice(0, 12).map((c) => `/category/${c}`).join(", ")}
   Первая ссылка в \`related\` ОБЯЗАТЕЛЬНО должна вести на \`${brief.ctaDefault.href}\`.
9. \`ctaButton\`: \`{ "text": "...", "href": "${brief.ctaDefault.href}" }\`.

Верни ответ СТРОГО в формате JSON-объекта по схеме (без Markdown-обёртки).`;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  required: ["slug", "title", "description", "body", "faq", "related", "ctaButton"],
  properties: {
    slug: { type: "STRING" },
    title: { type: "STRING" },
    description: { type: "STRING" },
    body: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    faq: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["q", "a"],
        properties: {
          q: { type: "STRING" },
          a: { type: "STRING" },
        },
      },
    },
    related: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        required: ["text", "href"],
        properties: {
          text: { type: "STRING" },
          href: { type: "STRING" },
        },
      },
    },
    ctaButton: {
      type: "OBJECT",
      required: ["text", "href"],
      properties: {
        text: { type: "STRING" },
        href: { type: "STRING" },
      },
    },
  },
};

function sanitizeSlug(raw, fallbackSlug, forbiddenSlugs) {
  let clean = String(raw || fallbackSlug)
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 75);
  if (clean.length < 10) clean = fallbackSlug;
  if (forbiddenSlugs.has(clean)) {
    clean = `${clean}-${Date.now().toString().slice(-4)}`;
  }
  return clean;
}

function validateAndNormalizeArticle(raw, {
  brief,
  mskYmd,
  forbiddenSlugs,
  validStoreSlugs,
  validCategorySlugs,
  validCollectionSlugs,
  existingArticleSlugs,
  storesBySlug,
}) {
  if (!raw || typeof raw !== "object") {
    return { ok: false, reason: "Пустой JSON от Gemini" };
  }

  const slug = sanitizeSlug(raw.slug, brief.suggestedSlug, forbiddenSlugs);
  const title = String(raw.title || "").replace(/\s+/g, " ").trim();
  const description = String(raw.description || "").replace(/\s+/g, " ").trim();
  const body = Array.isArray(raw.body)
    ? raw.body.map((p) => String(p || "").trim()).filter(Boolean)
    : [];

  if (title.length < 25 || title.length > 110) {
    return { ok: false, reason: `Некорректная длина title (${title.length})` };
  }
  if (description.length < 70 || description.length > 220) {
    return { ok: false, reason: `Некорректная длина description (${description.length})` };
  }
  if (body.length < 7 || body.filter((p) => p.startsWith("## ")).length < 2) {
    return { ok: false, reason: `Недостаточная структура body (абзацев=${body.length})` };
  }

  const fullText = [title, description, ...body].join("\n");
  const bannedMatch = fullText.match(BANNED_CLAIM_RE);
  if (bannedMatch) {
    return {
      ok: false,
      reason: `Обнаружена запрещённая недобросовестная формулировка (test:seo-truthful: «${bannedMatch[0]}»)`,
    };
  }
  const htmlMatch = fullText.match(HTML_TAG_RE);
  if (htmlMatch) {
    return { ok: false, reason: `Обнаружены сырые HTML-теги в теле статьи («${htmlMatch[0]}»)` };
  }
  if (BAD_BRAND_RE.test(fullText)) {
    return { ok: false, reason: "Обнаружено нежелательное упоминание Admitad" };
  }

  const faq = Array.isArray(raw.faq)
    ? raw.faq
        .filter((item) => item?.q && item?.a && !BANNED_CLAIM_RE.test(`${item.q} ${item.a}`))
        .map((item) => ({
          q: String(item.q).replace(/\s+/g, " ").trim(),
          a: String(item.a).replace(/\s+/g, " ").trim(),
        }))
        .slice(0, 6)
    : [];
  if (faq.length < 3) {
    return { ok: false, reason: "Недостаточно валидных FAQ-вопросов" };
  }

  // Фильтруем и нормализуем related-ссылки (только существующие маршруты без конфликтов)
  const isValidHref = (href) => {
    if (!href || typeof href !== "string") return false;
    if (href.startsWith("/store/")) {
      const s = href.slice("/store/".length).split(/[?#]/)[0];
      return validStoreSlugs.has(s) && !EXCLUDED_STORES.has(s);
    }
    if (href.startsWith("/category/")) {
      return validCategorySlugs.has(href.slice("/category/".length).split(/[?#]/)[0]);
    }
    if (href.startsWith("/collections/")) {
      return validCollectionSlugs.has(href.slice("/collections/".length).split(/[?#]/)[0]);
    }
    if (href.startsWith("/sovety/")) {
      return existingArticleSlugs.has(href.slice("/sovety/".length).split(/[?#]/)[0]);
    }
    return false;
  };

  const keptRelated = [];
  const seenHref = new Set();
  const mentionedStoreSlugs = [...brief.targetStores];

  const pushRelated = (text, href) => {
    const cleanHref = String(href || "").split("#")[0].trim();
    if (!isValidHref(cleanHref) || seenHref.has(cleanHref)) return;
    if (cleanHref.startsWith("/store/")) {
      const s = cleanHref.slice("/store/".length);
      if (!isCompatibleWithSelected(mentionedStoreSlugs, s)) return;
      mentionedStoreSlugs.push(s);
    }
    seenHref.add(cleanHref);
    keptRelated.push({
      text: String(text || "").replace(/\s+/g, " ").trim() || "Смотреть скидки",
      href: cleanHref,
    });
  };

  pushRelated(brief.ctaDefault.text.replace(/\s*→$/, ""), brief.ctaDefault.href);
  for (const ts of brief.targetStores) {
    if (keptRelated.length >= 4) break;
    const meta = storesBySlug.get(ts);
    if (meta) pushRelated(`Предложения ${meta.name}`, `/store/${ts}`);
  }
  for (const r of Array.isArray(raw.related) ? raw.related : []) {
    if (keptRelated.length >= 6) break;
    pushRelated(r?.text, r?.href);
  }
  if (!keptRelated.some((r) => r.href.startsWith("/collections/"))) {
    pushRelated("Банковские карты и кэшбэк", "/collections/finansy-i-karty");
  }

  const ctaHref = isValidHref(raw.ctaButton?.href) ? raw.ctaButton.href : brief.ctaDefault.href;
  const ctaButton = {
    text: String(raw.ctaButton?.text || brief.ctaDefault.text).trim().slice(0, 70),
    href: ctaHref,
  };

  return {
    ok: true,
    article: {
      slug,
      title,
      description,
      body,
      published: mskYmd,
      faq,
      related: keptRelated,
      ctaButton,
    },
  };
}

async function callGeminiWithFallback(apiKey, prompt) {
  let lastErr = null;
  for (const model of GEMINI_MODELS) {
    console.log(`[generate-article] Запрос к Gemini модели: ${model}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
    try {
      const res = await requestJson(url, {
        method: "POST",
        timeoutMs: 90000,
        headers: {
          "x-goog-api-key": apiKey,
        },
        body: {
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
          },
        },
      });

      if (!res.ok) {
        const msg = res.json?.error?.message || res.text.slice(0, 200);
        throw new Error(`HTTP ${res.status}: ${msg}`);
      }

      const rawText = res.json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error("Пустой ответ candidates[0].content");
      }

      const cleaned = rawText
        .replace(/^```json\s*/i, "")
        .replace(/```\s*$/, "")
        .trim();
      const parsed = JSON.parse(cleaned);
      return { model, parsed };
    } catch (err) {
      lastErr = err;
      console.warn(`[generate-article] Модель ${model} не сработала: ${err.message}`);
    }
  }
  throw lastErr || new Error("Все модели Gemini не смогли сгенерировать статью");
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const slotArg = process.argv.find((a) => a.startsWith("--slot="));
  const requestedSlot = slotArg ? slotArg.slice("--slot=".length).trim() : "auto";

  const fileEnv = loadEnvLocal();
  const apiKey = getEnv("GEMINI_API_KEY", fileEnv);
  const widgetUrl = getEnv("PERFLUENCE_WIDGET_URL", fileEnv);

  if (!apiKey) {
    throw new Error("Не задан GEMINI_API_KEY (проверьте GitHub Secrets или .env.local)");
  }

  const nowDate = new Date();
  const nowMs = nowDate.getTime();
  const mskDate = new Date(nowMs + 3 * 3600 * 1000);
  const mskYmd = mskDate.toISOString().slice(0, 10);

  const storesMeta = loadStableStores();
  const validStoreSlugs = new Set(storesMeta.stores.map((s) => s.slug));
  const validCategorySlugs = loadCategorySlugs();
  const validCollectionSlugs = loadCollectionSlugs();
  const goneSlugs = loadGoneSlugs();
  const existing = loadExistingArticles();
  const forbiddenSlugs = new Set([...existing.slugs, ...goneSlugs, "promokody-dodo-pizza"]);

  const slot = resolveSlot(requestedSlot, existing.generated, nowDate);
  console.log(`[generate-article] Дата МСК: ${mskYmd}, слот: ${slot} (dryRun=${dryRun})`);

  const [storeOffers, pampaduOffers] = await Promise.all([
    loadActivePerfluenceByStore(widgetUrl, storesMeta, nowMs),
    Promise.resolve(loadPampaduOffers(nowMs)),
  ]);

  const brief = pickTopicBrief({
    slot,
    storeOffers,
    pampaduOffers,
    existingSlugs: forbiddenSlugs,
    existingTitles: existing.titles,
    mskYmd,
  });

  console.log(`[generate-article] Выбрана тема (${brief.slot}): ${brief.suggestedSlug}`);

  const basePrompt = buildGeminiPrompt({
    brief,
    validStoreSlugs,
    validCategorySlugs,
    validCollectionSlugs,
    existingSlugs: forbiddenSlugs,
    mskYmd,
  });

  let article = null;
  let lastValidationReason = "";
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const prompt = lastValidationReason
      ? `${basePrompt}\n\nВАЖНОЕ ЗАМЕЧАНИЕ К ПОПЫТКЕ #${attempt - 1}: статья была отклонена валидатором по причине: ${lastValidationReason}\nПерепиши JSON целиком и полностью исключи указанное нарушение (особенно проверь отсутствие любых слов с корнем «гарантир» и любых обещаний вроде «100% сработает» / «бессрочный»).`
      : basePrompt;

    const { model, parsed } = await callGeminiWithFallback(apiKey, prompt);
    console.log(`[generate-article] Попытка ${attempt}/${maxAttempts}: получен JSON от ${model}`);

    const validated = validateAndNormalizeArticle(parsed, {
      brief,
      mskYmd,
      forbiddenSlugs,
      validStoreSlugs,
      validCategorySlugs,
      validCollectionSlugs,
      existingArticleSlugs: existing.slugs,
      storesBySlug: storesMeta.bySlug,
    });

    if (validated.ok) {
      article = validated.article;
      break;
    }

    lastValidationReason = validated.reason;
    console.warn(`[generate-article] Попытка ${attempt}/${maxAttempts} отклонена: ${lastValidationReason}`);
  }

  if (!article) {
    throw new Error(`Сгенерированная статья отклонена валидатором после ${maxAttempts} попыток: ${lastValidationReason}`);
  }
  console.log(`[generate-article] Валидация ПРОЙДЕНА:`);
  console.log(`  slug: ${article.slug}`);
  console.log(`  title: ${article.title} (${article.title.length} симв.)`);
  console.log(`  description: ${article.description.length} симв.`);
  console.log(`  body: ${article.body.length} блоков, faq: ${article.faq.length}, related: ${article.related.length}`);

  if (dryRun) {
    console.log("\n[DRY RUN] Итоговый JSON статьи:\n" + JSON.stringify(article, null, 2));
    return;
  }

  const updated = [article, ...existing.generated];
  fs.mkdirSync(path.dirname(GENERATED_PATH), { recursive: true });
  fs.writeFileSync(GENERATED_PATH, JSON.stringify(updated, null, 2) + "\n", "utf8");
  console.log(`✓ Статья сохранена в src/data/generated-articles.json (всего в реестре: ${updated.length})`);
}

main().catch((err) => {
  console.error("❌ Ошибка generate-article:", err);
  process.exit(1);
});
