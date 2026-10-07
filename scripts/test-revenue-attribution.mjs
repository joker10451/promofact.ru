import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

console.log("=== Проверка P1.1: Revenue Attribution Tracking ===");

// 1. Проверка CouponTicket.tsx
const couponTicketSource = fs.readFileSync(
  path.join(rootDir, "src/components/CouponTicket.tsx"),
  "utf8"
);

// 1.1 Типизация placement
const expectedPlacements = [
  "home_catalog",
  "home_hot_deals",
  "store_coupon",
  "article_coupon",
  "category_coupon",
  "collection_coupon",
  "geo_city_coupon",
  "geo_category_coupon",
  "coupon_detail",
  "unknown",
];

for (const p of expectedPlacements) {
  assert.ok(
    couponTicketSource.includes(`"${p}"`),
    `В CouponTicket.tsx отсутствует значение placement "${p}"`
  );
}
console.log("✓ Все 10 значений placement объявлены в CouponTicket.tsx");

// 1.2 Проверка формирования единого analytics context
assert.ok(
  couponTicketSource.includes("const getAnalyticsContext = () =>"),
  "В CouponTicket.tsx отсутствует helper getAnalyticsContext"
);
assert.ok(
  couponTicketSource.includes("store: store.slug"),
  "В контексте отсутствует store.slug"
);
assert.ok(
  couponTicketSource.includes("coupon_id: coupon.id"),
  "В контексте отсутствует coupon_id"
);
assert.ok(
  couponTicketSource.includes("placement,"),
  "В контексте отсутствует placement"
);
assert.ok(
  couponTicketSource.includes("page_path:"),
  "В контексте отсутствует page_path"
);
assert.ok(
  couponTicketSource.includes("page_type:"),
  "В контексте отсутствует page_type"
);
assert.ok(
  couponTicketSource.includes("offer_type:"),
  "В контексте отсутствует offer_type"
);
assert.ok(
  couponTicketSource.includes("source_component: \"coupon_ticket\""),
  "В контексте отсутствует source_component"
);
console.log("✓ Helper getAnalyticsContext содержит все требуемые поля (store, coupon_id, placement, page_path, page_type, offer_type, source_component)");

// 1.3 Проверка обогащения всех вороночных событий
const eventsToCheck = [
  { event: "affiliate_click", pattern: /ymReachGoal\("affiliate_click",\s*getAnalyticsContext\(\)\)/ },
  { event: "copy_code", pattern: /ymReachGoal\("copy_code",\s*ctx\)/ },
  { event: "promo_show", pattern: /ymReachGoal\("promo_show",\s*ctx\)/ },
  { event: "copy_and_open", pattern: /ymReachGoal\("copy_and_open",\s*getAnalyticsContext\(\)\)/ },
  { event: "coupon_terms_open", pattern: /ymReachGoal\("coupon_terms_open",\s*getAnalyticsContext\(\)\)/ },
];

for (const { event, pattern } of eventsToCheck) {
  assert.ok(
    pattern.test(couponTicketSource),
    `Событие ${event} не передаёт полный контекст getAnalyticsContext()`
  );
}
console.log("✓ Все ключевые события воронки (affiliate_click, copy_code, promo_show, copy_and_open, coupon_terms_open) обогащены единым контекстом");

// 1.4 Проверка отсутствия сырого промокода в контексте
assert.ok(
  !couponTicketSource.includes("code: promocode.code") &&
  !couponTicketSource.includes("promocode: promocode.code") &&
  !couponTicketSource.includes("code: offer.code"),
  "Обнаружена прямая передача сырого промокода в analytics context!"
);
console.log("✓ Сырой промокод не передаётся в аналитику (используется coupon_id)");

// 1.5 Проверка отсутствия line-clamp на маркировке рекламы (ОРД / erid)
assert.ok(
  !couponTicketSource.includes("text-[9px] text-ink/30 line-clamp-1"),
  "В CouponTicket.tsx остался line-clamp-1 на ОРД маркировке, скрывающий erid токен!"
);
console.log("✓ ОРД/erid маркировка не обрезается через line-clamp-1");

// 2. Проверка защиты чувствительных ключей в YandexMetrika.tsx
const metrikaSource = fs.readFileSync(
  path.join(rootDir, "src/components/YandexMetrika.tsx"),
  "utf8"
);
for (const key of ["code", "promocode", "promoCode", "query", "token", "secret"]) {
  assert.ok(
    metrikaSource.includes(`"${key}"`),
    `В YandexMetrika.tsx в sensitiveKeys отсутствует ключ "${key}"`
  );
}
console.log("✓ YandexMetrika.tsx сохраняет фильтрацию sensitiveKeys (code, promocode, promoCode и др.)");

// 3. Проверка явной передачи placement на всех call sites
const callSites = [
  { file: "src/components/CouponGrid.tsx", count: 2, placement: "home_catalog" },
  { file: "src/components/StoreCouponBrowser.tsx", count: 1, placement: "store_coupon" },
  { file: "src/app/sovety/[slug]/page.tsx", count: 2, placement: "article_coupon" },
  { file: "src/app/category/[slug]/page.tsx", count: 1, placement: "category_coupon" },
  { file: "src/app/collections/[slug]/page.tsx", count: 1, placement: "collection_coupon" },
  { file: "src/app/gorod/[slug]/page.tsx", count: 1, placement: "geo_city_coupon" },
  { file: "src/app/gorod/[slug]/[category]/page.tsx", count: 1, placement: "geo_category_coupon" },
  { file: "src/app/store/[slug]/[code]/page.tsx", count: 1, placement: "coupon_detail" },
  { file: "src/components/HotDeals.tsx", count: 1, placement: "home_hot_deals" },
];

let totalCallSitesFound = 0;
for (const { file, count, placement } of callSites) {
  const content = fs.readFileSync(path.join(rootDir, file), "utf8");
  const matches = [...content.matchAll(/placement="([^"]+)"/g)].filter(
    (m) => m[1] === placement
  );
  assert.strictEqual(
    matches.length,
    count,
    `В ${file} ожидалось ${count} вхождений placement="${placement}", найдено ${matches.length}`
  );
  totalCallSitesFound += matches.length;
}
assert.strictEqual(totalCallSitesFound, 11, `Ожидалось ровно 11 вызовов CouponTicket, найдено ${totalCallSitesFound}`);
console.log(`✓ Все 11 вызовов CouponTicket передают явный placement`);

console.log("🎉 Все проверки Revenue Attribution P1.1 успешно пройдены!");
