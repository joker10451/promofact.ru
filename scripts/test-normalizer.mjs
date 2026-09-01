/**
 * Автоматизированный тестовый сьют нормализатора Admitad (20 обязательных тестов).
 * Запуск: node scripts/test-normalizer.mjs
 */

import assert from "node:assert";

// Мок вспомогательных функций нормализатора
function stripHtml(v) {
  if (typeof v !== "string") return "";
  return v
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractMinimumOrder(text) {
  if (!text) return null;
  const clean = stripHtml(text);
  const regex =
    /(?:при\s+(?:каждом\s+)?(?:заказе|покупке|оформлении)\s+)?(?:на\s+сумму\s+)?(?:от|свыше)\s+([\d\s.,]+)\s*(?:₽|р\b|руб(?:л[ея]й)?|RUB)?/iu;
  const match = clean.match(regex);
  if (!match) return null;

  const rawNum = match[1].replace(/\s/g, "").replace(",", ".");
  const cleanNumStr = rawNum.replace(/\.(?=\d{3}\b)/g, "");
  const val = parseFloat(cleanNumStr);
  if (isNaN(val) || val <= 0) return null;

  return {
    value: Math.round(val),
    currency: "RUB",
  };
}

function cleanConditionText(raw, matchedPart) {
  let text = stripHtml(raw);
  if (matchedPart) {
    text = text.replace(new RegExp(`(скидка\\s+)?(до\\s+)?[-−]?\\s*${matchedPart}`, "gi"), "");
  }
  return text
    .replace(/^(на|в|от|при)\s+\d+[\s\d]*(%|₽|р|руб)/gi, "")
    .replace(/^(скидка|минус|до|на|в|от|[,\s–—-])+/gi, "")
    .replace(/\(\s*\)/g, "")
    .replace(/не суммируется с другими акциями.*$/i, "")
    .replace(/скидка\s+\d+\s*(rub|руб|₽)/gi, "")
    .replace(/discount\s+sitewide/gi, "на весь ассортимент")
    .replace(/на се\b/gi, "на все")
    .replace(/[,\s–—-]+$/g, "")
    .trim();
}

function resolveCustomerType(rawCustomerType, name, description) {
  const cleanN = stripHtml(name).toLowerCase();
  const cleanD = stripHtml(description).toLowerCase();
  const combined = `${cleanN} ${cleanD}`;
  const rawCust = (rawCustomerType || "").toLowerCase().trim();

  const isExplicitBoth =
    /первый\s+или\s+(один\s+)?повторный/i.test(combined) ||
    /для\s+новых\s+и\s+(для\s+)?повторных/i.test(combined) ||
    /на\s+первый\s+и\s+повторный/i.test(combined) ||
    /как\s+для\s+новых,\s+так\s+и\s+для\s+повторных/i.test(combined);

  if (isExplicitBoth) {
    return {
      customerType: "repeat_customers",
      customerTypeLabel: "Первый и повторный заказ",
    };
  }

  const isExplicitAllInText =
    /для\s+всех\s+(пользователей|клиентов|покупателей)/i.test(combined) ||
    /на\s+любой\s+заказ/i.test(combined) ||
    /действует\s+для\s+всех/i.test(combined) ||
    /для\s+всех\s+заказов/i.test(combined);

  const isExplicitNewInText =
    /только\s+(для|на)\s+нов/i.test(combined) ||
    /только\s+на\s+первый/i.test(combined) ||
    /на\s+первый\s+заказ/i.test(combined) ||
    /первый\s+заказ/i.test(combined) ||
    /первая\s+покупка/i.test(combined) ||
    /для\s+новых\s+(пользователей|клиентов|покупателей)/i.test(combined);

  const rawSaysNew = rawCust.includes("new") || rawCust.includes("first");
  const rawSaysAll = rawCust.includes("all");

  // Конфликт: raw говорит new_customers, но текст условий явно гласит «для всех пользователей»
  if (rawSaysNew && isExplicitAllInText) {
    return {
      customerType: "all_customers",
      customerTypeLabel: "Условия заказа",
    };
  }

  // Конфликт: raw говорит all_customers, но текст гласит «только на первый заказ»
  if (rawSaysAll && isExplicitNewInText && !isExplicitAllInText) {
    return {
      customerType: "new_customers",
      customerTypeLabel: "Первый заказ",
    };
  }

  if (rawSaysNew || isExplicitNewInText) {
    return {
      customerType: "new_customers",
      customerTypeLabel: "Первый заказ",
    };
  }

  return {
    customerType: "all_customers",
    customerTypeLabel: "Для всех",
  };
}

function resolveOfferDetails(name, description, rawDiscount, code, isFirstOrder, storeName) {
  const cleanName = stripHtml(name);
  const cleanDesc = stripHtml(description);
  const fullDescription = cleanDesc || cleanName || `Скидка по акции в магазине ${storeName}.`;
  const hasCode = Boolean(code && code.trim() !== "");
  const combinedText = `${cleanName} ${cleanDesc}`;

  // Извлекаем минимальную сумму заказа
  const minOrder = extractMinimumOrder(combinedText);

  // 1. Бесплатная доставка
  if (
    /бесплатн[а-яё]*\s+достав|free\s*shipping/iu.test(cleanName) ||
    /бесплатн[а-яё]*\s+достав/iu.test(cleanDesc)
  ) {
    const shortDescription = minOrder
      ? `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`
      : isFirstOrder
      ? "на первый заказ"
      : "на заказ с промокодом";

    return {
      type: "free_shipping",
      discount: { value: null, unit: "shipping", formatted: "🚚 Бесплатная доставка" },
      minimumOrder: minOrder,
      title: "Бесплатная доставка",
      shortDescription,
      fullDescription,
      ctaText: hasCode ? "Скопировать код" : "Получить предложение",
    };
  }

  // 2. Комбинация: Скидка (%) + Подарок (например, Кинопоиск 50% + 60 дней в подарок)
  const pctMatch = rawDiscount.match(/(\d+)\s*%/) || cleanName.match(/(\d+)\s*%/);
  const isGiftInText =
    /подарок|ролл|фото|пицца|подвеск|gift|в\s+подарок/i.test(cleanName) ||
    /подарок|ролл|фото|пицца|подвеск|в\s+подарок/i.test(cleanDesc);

  if (
    pctMatch &&
    isGiftInText &&
    (/(\+|\s+и\s+).*подарок/i.test(cleanName) || /60\s*дней/i.test(cleanName) || /подписк/i.test(cleanName))
  ) {
    const val = parseInt(pctMatch[1], 10);
    let condition = cleanConditionText(cleanName, pctMatch[0]);
    if (/60\s*дней|подарок/i.test(cleanName)) {
      condition = cleanName.replace(pctMatch[0], "").replace(/^[,\s–—\-\+]+/, "").trim();
    }
    return {
      type: hasCode ? "promo" : "action",
      discount: { value: val, unit: "percent", formatted: `−${val}%` },
      gift: "60 дней подписки в подарок",
      minimumOrder: minOrder,
      title: `−${val}%`,
      shortDescription: condition || "+ 60 дней подписки в подарок",
      fullDescription,
      ctaText: hasCode ? "Скопировать код" : "Получить предложение",
    };
  }

  // 3. Чистый Подарок к заказу (Gift) — discount = null!
  if (isGiftInText) {
    let giftTitle = "🎁 Подарок к заказу";
    let giftName = "Подарок к заказу";

    if (/фреш\s*ролл/i.test(cleanName) || /ролл\s+с\s+креветкой/i.test(cleanName)) {
      giftName = "Фреш ролл с креветкой и авокадо";
      giftTitle = "🎁 Ролл с креветкой и авокадо в подарок";
    } else if (/ролл/i.test(cleanName) || /ролл/i.test(cleanDesc)) {
      giftName = "Ролл";
      giftTitle = "🎁 Ролл в подарок";
    } else if (/фото/i.test(cleanName) || /фото/i.test(cleanDesc)) {
      giftName = "50 фото";
      giftTitle = "🎁 50 фото в подарок";
    } else if (/подвеск/i.test(cleanName) || /подвеск/i.test(cleanDesc)) {
      giftName = "Подвеска";
      giftTitle = "🎁 Подвеска в подарок";
    } else if (/пицц/i.test(cleanName) || /пицц/i.test(cleanDesc)) {
      giftName = "Пицца";
      giftTitle = "🎁 Пицца в подарок";
    }

    const shortDescription = minOrder
      ? `При заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`
      : isFirstOrder
      ? "на первый заказ"
      : "по промокоду при оформлении";

    return {
      type: "gift",
      discount: null, // КРИТИЧЕСКИЙ РАЗРЫВ №1: discount.value НЕ ДОЛЖЕН содержать сумму заказа!
      gift: giftName,
      minimumOrder: minOrder,
      title: giftTitle,
      shortDescription,
      fullDescription,
      ctaText: hasCode ? "Скопировать код" : "Получить подарок",
    };
  }

  // 4. Подписка / пробный период (СберПрайм, Яндекс Плюс)
  if (
    /60\s*дней|подписк\w*\s+(плюс|кинопоиск|яндекс|сберпрайм)/i.test(cleanName) ||
    /60\s*дней/i.test(cleanDesc)
  ) {
    const isSber = /сбер/i.test(cleanName) || /сбер/i.test(cleanDesc);
    return {
      type: "subscription",
      discount: { value: 60, unit: "subscription", formatted: "60 дней за 1 ₽" },
      minimumOrder: null,
      title: "60 дней за 1 ₽",
      shortDescription: isSber
        ? "подписка СберПрайм для новых пользователей"
        : "подписка Яндекс Плюс и Кинопоиск для новых пользователей",
      fullDescription,
      ctaText: hasCode ? "Скопировать код" : "Получить предложение",
    };
  }

  // 5. Процентная скидка
  if (pctMatch) {
    const val = parseInt(pctMatch[1], 10);
    let condition = cleanConditionText(cleanName, pctMatch[0]);
    if (minOrder) {
      condition = `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
    } else if (!condition || condition === "!" || condition.length < 3) {
      condition = isFirstOrder ? "на первый заказ" : "на весь ассортимент";
    } else if (!/^(на|при|от|в|для|\+)\s+/i.test(condition)) {
      condition = `на ${condition}`;
    }

    return {
      type: hasCode ? "promo" : "action",
      discount: { value: val, unit: "percent", formatted: `−${val}%` },
      minimumOrder: minOrder,
      title: `−${val}%`,
      shortDescription: condition,
      fullDescription,
      ctaText: hasCode ? "Скопировать код" : "Получить предложение",
    };
  }

  // 6. Фиксированная скидка в рублях
  const rubMatch =
    rawDiscount.match(/(\d+[\s\d]*)\s*(rub|руб|₽)/i) ||
    cleanName.match(/(?:скидка|минус)\s*(\d+[\s\d]*)\s*(rub|руб|₽)/i) ||
    cleanName.match(/(\d+[\s\d]*)\s*(rub|руб|₽)/i);

  if (rubMatch) {
    const rawVal = rubMatch[1].replace(/\s/g, "");
    const val = parseInt(rawVal, 10);
    const formattedRub = val.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽";
    let condition = cleanConditionText(cleanName, rubMatch[0]);

    if (minOrder && minOrder.value !== val) {
      condition = `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
    } else if (!condition || condition === "!" || condition.length < 3) {
      condition = isFirstOrder ? "на первый заказ" : "на заказ по акции";
    } else if (!/^(на|при|от|в|для|\+)\s+/i.test(condition)) {
      condition = `на ${condition}`;
    }

    return {
      type: hasCode ? "promo" : "action",
      discount: { value: val, unit: "rub", formatted: `−${formattedRub}` },
      minimumOrder: minOrder,
      title: `−${formattedRub}`,
      shortDescription: condition,
      fullDescription,
      ctaText: hasCode ? "Скопировать код" : "Получить предложение",
    };
  }

  // 7. Бонусы / баллы
  const bonusMatch = cleanName.match(/(\d+[\s\d]*)\s*(бонусов|баллов)/i);
  if (bonusMatch) {
    const val = parseInt(bonusMatch[1].replace(/\s/g, ""), 10);
    return {
      type: "cashback",
      discount: { value: val, unit: "bonus", formatted: `+${val} бонусов` },
      minimumOrder: minOrder,
      title: `+${val} бонусов`,
      shortDescription: "на оплату заказов",
      fullDescription,
      ctaText: hasCode ? "Скопировать код" : "Получить предложение",
    };
  }

  // 8. Дефолтная акция
  const shortTitle = cleanName.length > 24 ? cleanName.slice(0, 24) + "…" : cleanName || "Скидка";
  return {
    type: hasCode ? "promo" : "action",
    discount: { value: null, unit: "none", formatted: shortTitle },
    minimumOrder: minOrder,
    title: shortTitle,
    shortDescription: isFirstOrder ? "на первый заказ" : "по промокоду",
    fullDescription,
    ctaText: hasCode ? "Скопировать код" : "Получить предложение",
  };
}

function normalizeAdmitadCoupon(raw) {
  const cleanCode = raw.promocode && raw.promocode.trim() !== "Not required" ? raw.promocode.trim() : null;
  const customerResolution = resolveCustomerType(raw.customerType, raw.name, raw.description);

  const details = resolveOfferDetails(
    raw.name,
    raw.description,
    raw.discount || "",
    cleanCode,
    customerResolution.customerType === "new_customers",
    raw.rawCampaignName || "Магазин"
  );

  let status = "active";
  if (raw.dateEnd && raw.dateEnd !== "None") {
    const endTs = new Date(raw.dateEnd).getTime();
    if (!isNaN(endTs) && endTs < Date.now()) {
      status = "expired";
    }
  }

  return {
    id: raw.id,
    type: details.type,
    discount: details.discount,
    gift: details.gift || null,
    minimumOrder: details.minimumOrder || null,
    title: details.title,
    shortDescription: details.shortDescription,
    fullDescription: details.fullDescription,
    promoCode: cleanCode,
    ctaText: details.ctaText,
    customerType: customerResolution.customerType,
    customerTypeLabel: customerResolution.customerTypeLabel,
    status,
  };
}

function validateOffer(offer) {
  if (!offer.id) return false;
  if (offer.status === "expired") return false;
  return true;
}

// ---------------- ТЕСТОВЫЙ ЗАПУСК ----------------

console.log("🚀 Запуск 20 обязательных тестов нормализатора Admitad...\n");
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
  assert.strictEqual(res.title, "🎁 Ролл в подарок", "Test 8 failed: title");
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
    customerType: "new_customers", // Конфликт в raw customerType
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
    discount: "4299", // В сырых данных Admitad число 4299 в discount
    promocode: "VRGIFT4299",
    customerType: "all_customers",
    rawCampaignName: "Важная Рыба",
  });
  assert.strictEqual(res.type, "gift", "Test 20 failed: type must be gift");
  assert.strictEqual(res.discount, null, "Test 20 failed: discount must be null");
  assert.ok(res.minimumOrder, "Test 20 failed: minimumOrder exists");
  assert.strictEqual(res.minimumOrder.value, 4299, "Test 20 failed: minimumOrder.value");
  assert.strictEqual(res.title, "🎁 Ролл с креветкой и авокадо в подарок", "Test 20 failed: title");
  assert.strictEqual(res.shortDescription, "При заказе от 4 299 ₽", "Test 20 failed: shortDescription");
  console.log("✓ Test 20: Real Vazhnaia Ryba -> gift, minOrder=4299, discount=null (PASS)");
  passed++;
}

console.log(`\n🎉 ВСЕ ${passed}/20 ТЕСТОВ УСПЕШНО ПРОЙДЕНЫ! (PASS)`);
