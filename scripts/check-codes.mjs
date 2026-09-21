// node scripts/check-codes.mjs
//
// Сверяет промокоды, которые упомянуты в статьях и в ручных купонах, с тем,
// что сейчас отдаёт кабинет Perfluence. Истёкший код в статье — это не просто
// неточность: человек копирует его, получает отказ в корзине и уходит, а мы
// платим за это доверием и конверсией. Следить за сроками вручную по 34
// проектам нереально, поэтому проверку делает скрипт.
//
// Что показывает:
//   ИСТЁК     — код есть в кабинете, но срок вышел
//   СКОРО     — срок выходит в ближайшие 3 дня
//   НЕИЗВЕСТЕН — код в тексте есть, а в кабинете его больше нет
import fs from "node:fs";
import path from "node:path";
import { createJiti } from "jiti";

const ROOT = process.cwd();
const SOON_DAYS = 3;

function widgetUrl() {
  const file = path.join(ROOT, ".env.local");
  if (!fs.existsSync(file)) return process.env.PERFLUENCE_WIDGET_URL || "";
  const m = fs.readFileSync(file, "utf8").match(/^PERFLUENCE_WIDGET_URL=(.*)$/m);
  return (m ? m[1] : process.env.PERFLUENCE_WIDGET_URL || "").trim().replace(/^["']|["']$/g, "");
}

function parseDate(value) {
  const m = String(value || "").match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (!m) return null;
  // Код живёт до конца своего последнего дня
  return new Date(+m[3], +m[2] - 1, +m[1], 23, 59, 59);
}

async function loadActualCodes() {
  const url = widgetUrl();
  if (!url) throw new Error("нет PERFLUENCE_WIDGET_URL");
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  const data = await res.json();
  const codes = new Map();
  for (const item of Object.values(data.data || {})) {
    const store = item.project?.name || "магазин";
    for (const promo of item.groups?.[0]?.promocodes || []) {
      const code = String(promo.code || "").trim();
      if (code) codes.set(code.toUpperCase(), { store, until: parseDate(promo.date), raw: promo.date });
    }
  }
  return codes;
}

/** Тексты статей: заголовок, описание и тело в одной строке на статью. */
function loadArticles() {
  const jiti = createJiti(ROOT + "/", { alias: { "@": path.join(ROOT, "src") } });
  const { ARTICLES } = jiti("./src/lib/articles.ts");
  return ARTICLES.map((a) => ({
    slug: a.slug,
    text: [a.title, a.description, ...(a.body || []), ...(a.faq || []).flatMap((f) => [f.q, f.a])].join("\n"),
  }));
}

/**
 * Похоже на промокод: 5–24 символа, есть и буква, и цифра. Буквы бывают
 * кириллические — ЛАЙМ291 и УГОРЬ549 у Важной Рыбы вполне реальные коды.
 * Чистые числа (суммы, годы, ИНН) кодами не считаем: иначе отчёт тонет
 * в «2026» и «1500 ₽».
 */
const CODE_LIKE = /\b[A-Za-zА-Яа-яЁё0-9_-]{5,24}\b/g;
const hasLetter = (s) => /[A-Za-zА-Яа-яЁё]/.test(s);
const hasDigit = (s) => /\d/.test(s);
/** Год, сумма или телефонный хвост — не код. */
const looksLikeNumber = (s) => /^\d+$/.test(s) || /^(19|20)\d{2}$/.test(s);
const IGNORE = new Set(["ERID", "PROMOFACT", "SMART_ZAKUPKA"]);

const actual = await loadActualCodes();
const articles = loadArticles();
const now = Date.now();

const rows = [];
for (const article of articles) {
  const seen = new Set();
  for (const match of article.text.matchAll(CODE_LIKE)) {
    const code = match[0].toUpperCase();
    if (seen.has(code) || IGNORE.has(code)) continue;
    seen.add(code);
    const info = actual.get(code);
    if (!info) {
      // Код мог быть написан строчными — тогда в кабинете он есть в другом регистре
      rows.push({ status: "НЕИЗВЕСТЕН", code: match[0], slug: article.slug, note: "нет в кабинете" });
      continue;
    }
    if (!info.until) continue;
    const days = Math.ceil((info.until.getTime() - now) / 86400000);
    if (days < 0) rows.push({ status: "ИСТЁК", code: match[0], slug: article.slug, note: `${info.store}, срок ${info.raw}` });
    else if (days <= SOON_DAYS) rows.push({ status: "СКОРО", code: match[0], slug: article.slug, note: `${info.store}, до ${info.raw}` });
  }
}

const order = { "ИСТЁК": 0, "СКОРО": 1, "НЕИЗВЕСТЕН": 2 };
rows.sort((a, b) => order[a.status] - order[b.status] || a.slug.localeCompare(b.slug));

for (const r of rows) console.log(`${r.status.padEnd(11)} ${r.code.padEnd(20)} ${r.slug} — ${r.note}`);

const counts = rows.reduce((acc, r) => ({ ...acc, [r.status]: (acc[r.status] || 0) + 1 }), {});
console.log(
  `\nитого: истекли ${counts["ИСТЁК"] || 0}, истекают за ${SOON_DAYS} дня ${counts["СКОРО"] || 0},` +
    ` нет в кабинете ${counts["НЕИЗВЕСТЕН"] || 0} (всего кодов в кабинете: ${actual.size})`,
);
