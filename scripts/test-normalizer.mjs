/**
 * scripts/test-normalizer.mjs
 * Автоматизированный тестовый сьют нормализатора Admitad и регрессионных тестов каталога.
 * Тестирует РЕАЛЬНЫЕ продакшен-модули проекта (src/lib/admitadNormalizer.ts, categoryTaxonomy.ts, sync-catalog.mjs).
 * Запуск: node --experimental-strip-types scripts/test-normalizer.mjs
 */

import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Подключаем загрузчик модулей для прозрачного резолва @/lib -> src/lib в ESM/TS
register("./scripts/ts-loader.mjs", pathToFileURL("./"));

const {
  stripHtml,
  extractMinimumOrder,
  cleanConditionText,
  normalizeAdmitadCoupon,
  validateOffer,
} = await import("@/lib/admitadNormalizer");

const { canonicalCategorySlug } = await import("@/lib/categoryTaxonomy");
const { parseDateTs, filterExpiredOffers } = await import("./sync-catalog.mjs");

console.log("================================================================================");
console.log("🚀 ЗАПУСК ТЕСТОВ ПРОДАКШЕН-НОРМАЛИЗАТОРА ADMITAD И РЕГРЕССИОННОГО СЬЮТА");
console.log("================================================================================\n");

let passed = 0;

// Test 1: Процентная скидка
{
  const res = normalizeAdmitadCoupon({
    id: 1,
    name: "Скидка 55% на первый заказ от 700 рублей",
    description: "Полные правила акции",
    discount: "55%",
    promocode: "PROMO55",
    customerType: "new_customers",
  });
  assert.strictEqual(res.discount.formatted, "−55%", "Test 1 failed: discount formatted");
  assert.strictEqual(res.discount.value, 55, "Test 1 failed: discount value");
  console.log("✓ Test 1: Процентная скидка 55% -> −55% (PASS)");
  passed++;
}

// Test 2: Фиксированная скидка 1050 RUB
{
  const res = normalizeAdmitadCoupon({
    id: 2,
    name: "Скидка 1050 RUB на заказ букетов",
    description: "Условия",
    discount: "1050 RUB",
    promocode: "FLOWERS1050",
    customerType: "all_customers",
  });
  assert.strictEqual(res.discount.formatted.replace(/\s+/g, " "), "−1 050 ₽", "Test 2 failed");
  console.log("✓ Test 2: Фиксированная скидка 1050 RUB -> −1 050 ₽ (PASS)");
  passed++;
}

// Test 3: Промокод существует -> CTA: Скопировать код
{
  const res = normalizeAdmitadCoupon({
    id: 3,
    name: "Скидка 20%",
    description: "Описание",
    discount: "20%",
    promocode: "SALE20",
    customerType: "all_customers",
  });
  assert.strictEqual(res.ctaText, "Скопировать код", "Test 3 failed");
  console.log("✓ Test 3: Промокод существует -> CTA: Скопировать код (PASS)");
  passed++;
}

// Test 4: Промокода нет -> CTA: Получить предложение
{
  const res = normalizeAdmitadCoupon({
    id: 4,
    name: "Скидка 30% в каталоге",
    description: "Описание",
    discount: "30%",
    promocode: "Not required",
    customerType: "all_customers",
  });
  assert.strictEqual(res.ctaText, "Получить предложение", "Test 4 failed");
  assert.strictEqual(res.promoCode, null, "Test 4 failed: promoCode must be null");
  console.log("✓ Test 4: Промокода нет -> CTA: Получить предложение (PASS)");
  passed++;
}

// Test 5: HTML в description
{
  const res = normalizeAdmitadCoupon({
    id: 5,
    name: "Скидка 15%",
    description: "<p>Купон <b>действует</b> на <a href='#'>товары</a>&nbsp;для дома.</p>",
    discount: "15%",
    promocode: "HOME15",
    customerType: "all_customers",
  });
  assert.ok(!res.fullDescription.includes("<p>"), "Test 5 failed: HTML exists");
  assert.ok(!res.fullDescription.includes("&nbsp;"), "Test 5 failed: HTML entities exist");
  assert.strictEqual(res.fullDescription, "Купон действует на товары для дома.", "Test 5 failed: clean text");
  console.log("✓ Test 5: HTML в description полностью очищен (PASS)");
  passed++;
}

// Test 6: Очень длинное описание
{
  const longDesc =
    "Скидка 55% на первый заказ от 700 руб. Промокод действует на товары из каталога. Предложение распространяется на новых пользователей. Не суммируется с другими предложениями. " +
    "Правила использования: добавьте товар в корзину, перейдите к оформлению, укажите промокод в специальном поле ввода и нажмите кнопку 'Применить'.";
  const res = normalizeAdmitadCoupon({
    id: 6,
    name: "Скидка 55% на первый заказ от 700 руб",
    description: longDesc,
    discount: "55%",
    promocode: "NEW55",
    customerType: "new_customers",
  });
  assert.ok(res.shortDescription.length < 50, "Test 6 failed: shortDescription is too long");
  assert.strictEqual(res.fullDescription, longDesc, "Test 6 failed: fullDescription must be preserved");
  console.log("✓ Test 6: Лаконичный shortDescription и сохранённый fullDescription (PASS)");
  passed++;
}

// Test 7: Первый заказ (new_customers)
{
  const res = normalizeAdmitadCoupon({
    id: 7,
    name: "Скидка 10% для новых клиентов",
    description: "Только для новых клиентов",
    discount: "10%",
    promocode: "FIRST10",
    customerType: "new_customers",
  });
  assert.strictEqual(res.customerType, "new_customers", "Test 7 failed: customerType");
  assert.strictEqual(res.customerTypeLabel, "Первый заказ", "Test 7 failed: label");
  console.log("✓ Test 7: customer_type=new_customers -> 'Первый заказ' (PASS)");
  passed++;
}

// Test 8: Подарок к заказу (не 0%)
{
  const res = normalizeAdmitadCoupon({
    id: 8,
    name: "Ролл Калифорния в подарок при заказе от 1500 ₽",
    description: "Добавьте ролл и примените промокод",
    discount: "",
    promocode: "ROLLGIFT",
    customerType: "all_customers",
  });
  assert.strictEqual(res.type, "gift", "Test 8 failed: type must be gift");
  assert.strictEqual(res.discount, null, "Test 8 failed: discount must be null for gift");
  assert.strictEqual(res.title, "Ролл в подарок", "Test 8 failed: title");
  console.log("✓ Test 8: Подарок к заказу распознан корректно (type=gift, discount=null) (PASS)");
  passed++;
}

// Test 9: Бесплатная доставка
{
  const res = normalizeAdmitadCoupon({
    id: 9,
    name: "Бесплатная доставка от 2000 ₽",
    description: "Бесплатная доставка по промокоду",
    discount: "",
    promocode: "FREESHIP",
    customerType: "all_customers",
  });
  assert.strictEqual(res.type, "free_shipping", "Test 9 failed: type");
  assert.strictEqual(res.discount.formatted, "🚚 Бесплатная доставка", "Test 9 failed: formatted");
  console.log("✓ Test 9: Бесплатная доставка распознана как free_shipping (PASS)");
  passed++;
}

// Test 10: Истёкший купон
{
  const res = normalizeAdmitadCoupon({
    id: 10,
    name: "Скидка 40%",
    description: "Старая акция",
    discount: "40%",
    promocode: "OLD40",
    customerType: "all_customers",
    dateEnd: "2020-01-01T00:00:00",
  });
  assert.strictEqual(res.status, "expired", "Test 10 failed: status must be expired");
  assert.strictEqual(validateOffer(res), false, "Test 10 failed: validateOffer must return false");
  console.log("✓ Test 10: Истёкший купон помечен как expired и отфильтрован (PASS)");
  passed++;
}

// Test 11: Gift with minimum order
{
  const res = normalizeAdmitadCoupon({
    id: 11,
    name: "Фреш ролл с креветкой и авокадо в подарок при каждом заказе от 4 299 ₽",
    description: "Подарок к заказу",
    discount: "4299 RUB",
    promocode: "FRESH4299",
    customerType: "all_customers",
  });
  assert.strictEqual(res.type, "gift", "Test 11 failed: type must be gift");
  assert.strictEqual(res.discount, null, "Test 11 failed: discount must be null");
  assert.ok(res.minimumOrder, "Test 11 failed: minimumOrder must exist");
  assert.strictEqual(res.minimumOrder.value, 4299, "Test 11 failed: minimumOrder.value === 4299");
  console.log("✓ Test 11: Gift with minimum order (type=gift, discount=null, minOrder=4299) (PASS)");
  passed++;
}

// Test 12: Gift must never become discount
{
  const res = normalizeAdmitadCoupon({
    id: 12,
    name: "Пицца в подарок при заказе от 1 200 ₽",
    description: "Подарок к заказу",
    discount: "1200 RUB",
    promocode: "PIZZAGIFT",
    customerType: "all_customers",
  });
  assert.strictEqual(res.discount, null, "Test 12 failed: normalized.discount === null");
  console.log("✓ Test 12: Gift must never become discount (normalized.discount === null) (PASS)");
  passed++;
}

// Test 13: Minimum order extraction
{
  const extracted1 = extractMinimumOrder("в подарок при каждом заказе от 4 299 ₽");
  const extracted2 = extractMinimumOrder("от 4 299 руб.");
  const extracted3 = extractMinimumOrder("от 4.299 рублей");
  const extracted4 = extractMinimumOrder("при заказе на сумму от 4299");
  assert.strictEqual(extracted1?.value, 4299, "Test 13 failed: extracted1");
  assert.strictEqual(extracted2?.value, 4299, "Test 13 failed: extracted2");
  assert.strictEqual(extracted3?.value, 4299, "Test 13 failed: extracted3");
  assert.strictEqual(extracted4?.value, 4299, "Test 13 failed: extracted4");
  console.log("✓ Test 13: Minimum order extraction (4299 from various formats) (PASS)");
  passed++;
}

// Test 14: Customer type conflict
{
  const res = normalizeAdmitadCoupon({
    id: 14,
    name: "Скидка 10%",
    description: "Промокод действует для всех пользователей на любые заказы",
    discount: "10%",
    promocode: "ALL10",
    customerType: "new_customers", // Конфликт!
  });
  assert.notStrictEqual(res.customerTypeLabel, "Первый заказ", "Test 14 failed: label must not be 'Первый заказ'");
  assert.strictEqual(res.customerTypeLabel, "Условия заказа", "Test 14 failed: conflict fallback");
  console.log("✓ Test 14: Customer type conflict resolved safely (badge !== 'Первый заказ') (PASS)");
  passed++;
}

// Test 15: Repeat customer
{
  const res = normalizeAdmitadCoupon({
    id: 15,
    name: "Скидка на первый или один повторный заказ",
    description: "Действует на первый или один повторный заказ",
    discount: "15%",
    promocode: "REPEAT15",
    customerType: "all_customers",
  });
  assert.notStrictEqual(res.customerTypeLabel, "Для всех", "Test 15 failed: label must not be 'Для всех'");
  assert.strictEqual(res.customerTypeLabel, "Первый и повторный заказ", "Test 15 failed: label");
  console.log("✓ Test 15: Repeat customer resolved ('Первый и повторный заказ') (PASS)");
  passed++;
}

// Test 16: Real Plati po Miru
{
  const res = normalizeAdmitadCoupon({
    id: 16,
    name: "Скидка 500 ₽ на оформление международной карты",
    description: "Действует на выпуск виртуальной карты для оплаты зарубежных сервисов.",
    discount: "500 RUB",
    promocode: "SALEADS2026",
    customerType: "all_customers",
    rawCampaignName: "Плати по миру",
  });
  assert.strictEqual(res.discount.formatted.replace(/\s+/g, " "), "−500 ₽", "Test 16 failed: discount formatted");
  assert.strictEqual(res.discount.value, 500, "Test 16 failed: discount value");
  console.log("✓ Test 16: Real Plati po Miru -> −500 ₽ (PASS)");
  passed++;
}

// Test 17: Real SberPrime
{
  const res = normalizeAdmitadCoupon({
    id: 17,
    name: "СберПрайм 60 дней за 1 ₽",
    description: "Для новичков действует пробный период СберПрайм 60 дней за 1 ₽.",
    discount: "",
    promocode: "",
    customerType: "all_customers",
    rawCampaignName: "СберПрайм",
  });
  assert.strictEqual(res.type, "subscription", "Test 17 failed: type must be subscription");
  assert.strictEqual(res.promoCode, null, "Test 17 failed: promoCode must be null");
  assert.strictEqual(res.ctaText, "Получить предложение", "Test 17 failed: CTA");
  console.log("✓ Test 17: Real SberPrime -> subscription, no code, 'Получить предложение' (PASS)");
  passed++;
}

// Test 18: Real Kinopoisk
{
  const res = normalizeAdmitadCoupon({
    id: 18,
    name: "Скидка 50% + 60 дней подписки в подарок",
    description: "Скидка 50% на подписку Яндекс Плюс и Кинопоиск + 60 дней бесплатного доступа для новых пользователей.",
    discount: "50%",
    promocode: "6ZJP6PZFQH",
    customerType: "new_customers",
    rawCampaignName: "Кинопоиск",
  });
  assert.strictEqual(res.discount.formatted, "−50%", "Test 18 failed: discount formatted");
  assert.ok(res.gift || res.shortDescription.includes("60 дней"), "Test 18 failed: gift info preserved");
  console.log("✓ Test 18: Real Kinopoisk -> discount + gift combined (PASS)");
  passed++;
}

// Test 19: Real Yandex Travel
{
  const res = normalizeAdmitadCoupon({
    id: 19,
    name: "Скидка 2 500 ₽ на бронирование отелей от 25 000 ₽",
    description: "Промокод действует для всех пользователей на бронирование от 25 000 ₽",
    discount: "2500 RUB",
    promocode: "TRAVEL2500",
    customerType: "new_customers",
    rawCampaignName: "Яндекс Путешествия",
  });
  assert.strictEqual(res.discount.formatted.replace(/\s+/g, " "), "−2 500 ₽", "Test 19 failed: discount formatted");
  assert.ok(res.minimumOrder, "Test 19 failed: minimumOrder exists");
  assert.strictEqual(res.minimumOrder.value, 25000, "Test 19 failed: minimumOrder value");
  assert.notStrictEqual(res.customerTypeLabel, "Первый заказ", "Test 19 failed: customerType conflict resolved");
  console.log("✓ Test 19: Real Yandex Travel -> −2 500 ₽, minOrder=25 000 ₽, conflict safe (PASS)");
  passed++;
}

// Test 20: Real Vazhnaia Ryba
{
  const res = normalizeAdmitadCoupon({
    id: 20,
    name: "Фреш ролл с креветкой и авокадо в подарок при каждом заказе от 4 299 ₽",
    description: "Условия: Фреш ролл с креветкой и авокадо в подарок при заказе от 4 299 ₽",
    discount: "4299",
    promocode: "VRGIFT4299",
    customerType: "all_customers",
    rawCampaignName: "Важная Рыба",
  });
  assert.strictEqual(res.type, "gift", "Test 20 failed: type must be gift");
  assert.strictEqual(res.discount, null, "Test 20 failed: discount must be null");
  assert.ok(res.minimumOrder, "Test 20 failed: minimumOrder exists");
  assert.strictEqual(res.minimumOrder.value, 4299, "Test 20 failed: minimumOrder.value");
  assert.strictEqual(res.title, "Ролл с креветкой и авокадо в подарок", "Test 20 failed: title");
  assert.strictEqual(res.shortDescription, "При заказе от 4 299 ₽", "Test 20 failed: shortDescription");
  console.log("✓ Test 20: Real Vazhnaia Ryba -> gift, minOrder=4299, discount=null (PASS)");
  passed++;
}

// Test 21: Dirty punctuation & '1 заказ' normalization -> 'на первый заказ'
{
  const res = normalizeAdmitadCoupon({
    id: 21,
    name: "Скидка 300 руб. на 1 заказ",
    description: "Скидка 300 руб. на 1 заказ",
    discount: "300 руб.",
    promocode: "PROMO300",
    customerType: "new_customers",
    rawCampaignName: "Самокат",
  });
  assert.strictEqual(res.title, "−300 ₽", "Test 21 failed: title");
  assert.strictEqual(res.shortDescription, "на первый заказ", "Test 21 failed: shortDescription must be 'на первый заказ'");
  console.log("✓ Test 21: Dirty '300 руб. на 1 заказ' -> title: '−300 ₽', condition: 'на первый заказ' (PASS)");
  passed++;
}

// Test 22: Stray dots, broken duplicate prepositions & minOrder -> 'на первый заказ от 1 000 ₽'
{
  const res = normalizeAdmitadCoupon({
    id: 22,
    name: "−300 ₽ на . на 1 заказ от 1 000 руб.",
    description: "Скидка 300 руб на 1-й заказ при заказе от 1000 руб",
    discount: "300 руб",
    promocode: "PROMO1000",
    customerType: "new_customers",
    rawCampaignName: "Самокат",
  });
  assert.strictEqual(res.title, "−300 ₽", "Test 22 failed: title");
  assert.strictEqual(res.shortDescription, "на первый заказ от 1 000 ₽", "Test 22 failed: shortDescription must be 'на первый заказ от 1 000 ₽'");
  console.log("✓ Test 22: Stray 'на . на 1 заказ от 1000 руб' -> 'на первый заказ от 1 000 ₽' (PASS)");
  passed++;
}

// Test 23: Cyrillic typo 'на се' -> 'на все' and safe prepositions for antivirus
{
  const res = normalizeAdmitadCoupon({
    id: 23,
    name: "Скидка 20% на се антивирусы для дома на любой срок действия и количество устройств",
    description: "Промокод предоставляет скидку 20% на се антивирусы для дома на любой срок действия и количество устройств",
    discount: "20%",
    promocode: "ANTIVIRUS20",
    customerType: "all_customers",
    rawCampaignName: "PRO32",
  });
  assert.strictEqual(res.title, "−20%", "Test 23 failed: title");
  assert.strictEqual(
    res.shortDescription,
    "на все антивирусы для дома на любой срок действия и количество устройств",
    "Test 23 failed: shortDescription must be 'на все антивирусы...'"
  );
  assert.ok(!res.shortDescription.includes("на се"), "Test 23 failed: must not contain 'на се'");
  console.log("✓ Test 23: Feed typo 'на се антивирусы...' -> 'на все антивирусы...' (PASS)");
  passed++;
}

// ================= РЕГРЕССИОННЫЕ ТЕСТЫ =================

// Test 24: Категории-алиасы не создают 404 и нормализуются к каноническим слагам
{
  assert.strictEqual(canonicalCategorySlug("krasota-i-uhod"), "kosmetika-i-parfyumeriya");
  assert.strictEqual(canonicalCategorySlug("eda-i-dostavka"), "dostavka-produktov");
  assert.strictEqual(canonicalCategorySlug("knigi-i-obuchenie"), "onlayn-obrazovanie");
  assert.strictEqual(canonicalCategorySlug("kino-i-teatr"), "onlayn-kinoteatry");
  console.log("✓ Test 24 [Регрессия]: Все устаревшие алиасы категорий нормализуются к каноническим (PASS)");
  passed++;
}

// Test 25: Валидация и фильтрация истёкших дат в каталоге
{
  const pastTs = parseDateTs("01.01.2020");
  const futureTs = parseDateTs("31.12.2030");
  const malformedTs = parseDateTs("невалидная дата");

  assert.ok(pastTs !== null && pastTs < Date.now(), "Past date must parse to past ts");
  assert.ok(futureTs !== null && futureTs > Date.now(), "Future date must parse to future ts");
  assert.strictEqual(malformedTs, null, "Malformed date must return null");

  const mockFeed = {
    data: [
      {
        id: 1,
        groups: [
          {
            promocodes: [
              { code: "VALID", date: "31.12.2030" },
              { code: "EXPIRED", date: "01.01.2020" },
              { code: "INVALID", date: "bad-date" },
            ],
          },
        ],
      },
    ],
  };

  const { cleanData, activePromos, expiredPromos } = filterExpiredOffers(mockFeed);
  assert.strictEqual(activePromos, 1, "Only 1 promo should be active");
  assert.strictEqual(expiredPromos, 2, "2 promos should be filtered as expired/invalid");
  assert.strictEqual(cleanData.data[0].groups[0].promocodes[0].code, "VALID");
  console.log("✓ Test 25 [Регрессия]: Фильтрация истёкших и повреждённых дат каталога работает корректно (PASS)");
  passed++;
}

// Test 26: Отсутствие битых ссылок на СберКарту и удаленные магазины в базе статей
{
  const articlesFile = fs.readFileSync(path.resolve("src/lib/articles.ts"), "utf-8");
  assert.ok(!articlesFile.includes("/store/kreditnaya-sberkarta"), "Must not link to /store/kreditnaya-sberkarta");
  assert.ok(!articlesFile.includes("/store/fix-price"), "Must not link to /store/fix-price");
  assert.ok(!articlesFile.includes("/category/yuvelirnye-izdeliya"), "Must not link to /category/yuvelirnye-izdeliya");
  console.log("✓ Test 26 [Регрессия]: В статьях устранены ссылки на несуществующие магазины и алиасы (PASS)");
  passed++;
}

// Test 27 [Регрессия]: Акции с кодом, без кода, с истёкшим сроком и без срока (сохранение групп)
{
  const testFeed = {
    data: [
      {
        id: 101,
        name: "Shop With Codes",
        groups: [
          {
            id: "g1",
            promocodes: [
              { code: "VALID_CODE", date: "31.12.2030" },
              { code: "EXPIRED_CODE", date: "01.01.2020" },
              { code: "PERPETUAL_CODE" }, // без срока
            ],
          },
        ],
      },
      {
        id: 102,
        name: "Shop Link Only",
        groups: [
          {
            id: "g2",
            promocodes: [],
            landing: { link: "https://partner.link/offer1", name: "Link Promo Active" },
          },
          {
            id: "g3",
            promocodes: [],
            date_end: "01.01.2021",
            landing: { link: "https://partner.link/offer2", name: "Link Promo Expired" },
          },
          {
            id: "g4",
            promocodes: [],
            landing: { name: "No Link At All" }, // без ссылки
          },
        ],
      },
      {
        // Legacy-структура (без поля groups, группа прямо в корне элемента)
        id: 103,
        name: "Legacy Shop Link",
        landing: { link: "https://partner.link/legacy-offer", name: "Legacy Promo" },
      },
    ],
  };

  const {
    cleanData,
    activePromos,
    expiredPromos,
    activeLinkOffers,
    expiredLinkOffers,
    totalOffers,
    activeOffers,
  } = filterExpiredOffers(testFeed);

  assert.strictEqual(activePromos, 2, "Должно быть 2 активных промокода (VALID_CODE, PERPETUAL_CODE)");
  assert.strictEqual(expiredPromos, 1, "Должен быть 1 истёкший промокод (EXPIRED_CODE)");
  assert.strictEqual(activeLinkOffers, 2, "Должно быть 2 активных оффера по ссылке (Shop Link Only g2 + Legacy Shop)");
  assert.strictEqual(expiredLinkOffers, 1, "Должен быть 1 истёкший оффер по ссылке (g3)");
  assert.strictEqual(activeOffers, 4, "Всего активных предложений: 4");
  assert.strictEqual(cleanData.data.length, 3, "Все 3 магазина должны быть сохранены");

  console.log("✓ Test 27 [Регрессия]: Фильтрация акций с кодом, без кода, без срока и legacy-структур (PASS)");
  passed++;
}

// Test 28 [Регрессия]: Защита от случайного обнуления каталога
{
  const { runCatalogSync } = await import("./sync-catalog.mjs");
  // Симуляция ответа API, где после фильтрации остаётся 0 активных предложений
  const wipeoutData = {
    data: [
      {
        id: 999,
        groups: [{ promocodes: [{ code: "OLD", date: "01.01.2020" }] }],
      },
    ],
  };

  const result = await runCatalogSync({ rawFeed: wipeoutData });

  assert.strictEqual(result.status, "fallback", "При обнулении каталога статус должен быть fallback");
  assert.ok(result.meta.error.includes("Аномальное обнуление"), "Должна быть зафиксирована ошибка обнуления");
  console.log("✓ Test 28 [Регрессия]: Защита от случайного обнуления каталога блокирует повреждение данных (PASS)");
  passed++;
}

// Test 29 [Регрессия]: Защита от резкого аномального сокращения каталога (>60% падение)
{
  const { runCatalogSync } = await import("./sync-catalog.mjs");
  // Симуляция ответа, где вернулся всего 1 проект вместо 35
  const truncatedData = {
    data: [
      {
        id: 111,
        groups: [{ promocodes: [{ code: "SINGLE", date: "31.12.2030" }] }],
      },
    ],
  };

  const result = await runCatalogSync({ rawFeed: truncatedData });

  assert.strictEqual(result.status, "fallback", "При аномальном сокращении статус должен быть fallback");
  assert.ok(result.meta.error.includes("Аномальное сокращение"), "Должна быть зафиксирована ошибка сокращения");
  console.log("✓ Test 29 [Регрессия]: Защита от резкого сокращения каталога блокирует срез данных (PASS)");
  passed++;
}

console.log(`\n🎉 ВСЕ ${passed}/29 ТЕСТОВ (23 Admitad + 6 Регрессий) УСПЕШНО ПРОЙДЕНЫ! (PASS)`);
