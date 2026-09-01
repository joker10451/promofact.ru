import { translit } from "@/lib/translit";
import { normalizeStore } from "@/lib/storeNormalizer";
import type {
  RawAdmitadCoupon,
  NormalizedOffer,
  OfferType,
  CustomerType,
  MinimumOrder,
  NormalizedDiscount,
} from "@/lib/admitadTypes";
import type { Coupon, Store, Promocode, Affiliate } from "@/lib/types";

/**
 * Категории Admitad маппим в понятные русские категории ПромоФакта
 */
const CATEGORY_MAP: Record<string, string> = {
  "18": "Сервисы и подписки",
  "62": "Маркетплейсы",
  "64": "Одежда и обувь",
  "65": "Бытовая техника и электроника",
  "66": "Все для дома",
  "67": "Косметика и парфюмерия",
  "69": "Детские товары",
  "72": "Цветы и подарки",
  "85": "Спорт и отдых",
  "89": "Хобби и канцтовары",
  "92": "Автотовары",
  "93": "Сервисы и подписки",
  "96": "Маркетплейсы",
  "98": "Онлайн-образование",
  "102": "Продукты и доставка",
  "122": "Сервисы и подписки",
  "257": "Сервисы и подписки",
  "382": "Маркетплейсы",
};

/**
 * Очистка HTML и служебных символов
 */
export function stripHtml(v: unknown): string {
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

/**
 * Извлечение минимальной суммы заказа (Minimum Order Extraction)
 * Поддерживает форматы:
 * - «от 4299 ₽», «от 4 299 руб.», «от 4.299 рублей», «от 4299 руб»
 * - «при заказе на сумму от 4299», «при заказе от 4299», «при каждом заказе от 4 299 ₽»
 * - «от 25 000 ₽», «при сумме заказа от 4299»
 */
export function extractMinimumOrder(text: string): MinimumOrder | null {
  if (!text) return null;
  const clean = stripHtml(text);
  const regex =
    /(?:при\s+(?:каждом\s+)?(?:заказе|покупке|оформлении)\s+)?(?:на\s+сумму\s+)?(?:от|свыше)\s+([\d\s.,]+)\s*(?:₽|р\b|руб(?:л[ея]й)?|RUB)?/iu;
  const match = clean.match(regex);
  if (!match) return null;

  const rawNum = match[1].replace(/\s/g, "").replace(",", ".");
  // Удаляем точку как разделитель тысяч (4.299 -> 4299)
  const cleanNumStr = rawNum.replace(/\.(?=\d{3}\b)/g, "");
  const val = parseFloat(cleanNumStr);
  if (isNaN(val) || val <= 0) return null;

  return {
    value: Math.round(val),
    currency: "RUB",
  };
}

/**
 * Очистка текста условий от типовых мусорных конструкций
 */
export function cleanConditionText(raw: string, matchedPart?: string): string {
  let text = stripHtml(raw);
  if (matchedPart) {
    text = text.replace(new RegExp(`(скидка\\s+)?(до\\s+)?[-−]?\\s*${matchedPart}`, "gi"), "");
  }
  return text
    .replace(/^(на|в|от|при)\s+\d+[\s\d]*(%|₽|р|руб)/gi, "")
    .replace(/^(скидка|минус|до|на|в|от|[,\s–—-])+/gi, "")
    .replace(/\(\s*\)/g, "") // удаление пустых скобок ()
    .replace(/не суммируется с другими акциями.*$/i, "")
    .replace(/скидка\s+\d+\s*(rub|руб|₽)/gi, "")
    .replace(/discount\s+sitewide/gi, "на весь ассортимент")
    .replace(/на се\b/gi, "на все") // опечатка «на се антивирусы»
    .replace(/[,\s–—-]+$/g, "")
    .trim();
}

/**
 * Разрешение customer_type с приоритетом и защитой от конфликтов:
 * 1. явное структурированное значение Admitad;
 * 2. анализ условий в description и name;
 * 3. если обнаружен конфликт — безопасный fallback "Условия заказа".
 */
export function resolveCustomerType(
  rawCustomerType: string | undefined,
  name: string,
  description: string
): { customerType: CustomerType; customerTypeLabel: string } {
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

/**
 * Проверка на иностранный спам и нелокализованные дампы
 */
export function isForeignJunk(name: string, terms: string, storeSlug: string): boolean {
  const text = `${name} ${terms}`.toLowerCase();
  if (
    /artículo|sconti|descuento|hasta\s+\d|dernières|tendances|vendedores|varan\s+indirimler|super\s+ofertas|choice\s*-\s*3|us\s+new\s+user|us\s+warehouse|do\s+brasil|articoli\s+per|best\s+aliexpress|sitewide|timeless\s*&\s*chic|bonus\s+time/i.test(
      text
    )
  ) {
    return true;
  }

  // Зарубежные магазины без доставки и адаптации в РФ
  if (/applicantally|sitpack|openhagen|noon|indiwd|alibaba/i.test(storeSlug)) {
    return true;
  }

  // Если в описании нет ни одной кириллической буквы и это не глобальный ИТ-сервис
  const hasCyrillic = /[а-яё]/i.test(text);
  if (!hasCyrillic && !text.includes("pro32") && !text.includes("itab")) {
    return true;
  }

  return false;
}

/**
 * Извлечение скидки, подарка, минимального заказа, типа акции и лаконичного описания
 */
export function resolveOfferDetails(
  name: string,
  description: string,
  rawDiscount: string,
  code: string | null,
  isFirstOrder: boolean,
  storeName: string
): {
  type: OfferType;
  discount: NormalizedDiscount | null;
  gift?: string | null;
  minimumOrder?: MinimumOrder | null;
  title: string;
  shortDescription: string;
  fullDescription: string;
  ctaText: string;
} {
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
      ? `при заказе от ${minOrder.value.toLocaleString("ru-RU")} ₽`
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

  // 3. Чистый Подарок к заказу (Gift) — КРИТИЧЕСКИЙ РАЗРЫВ №1: discount = null!
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

/**
 * Нормализация одного сырого купона Admitad
 */
export function normalizeAdmitadCoupon(raw: RawAdmitadCoupon): NormalizedOffer | null {
  const cleanCode =
    raw.promocode && raw.promocode.trim() !== "Not required" ? raw.promocode.trim() : null;

  const rawStoreName = raw.rawCampaignName || "Магазин";
  const rawStoreSlug = translit(rawStoreName) || "magazin";

  // Фильтр иностранного мусора
  if (isForeignJunk(raw.name, raw.description, rawStoreSlug)) {
    return null;
  }

  const categoryFromId = raw.rawCategoryId ? CATEGORY_MAP[raw.rawCategoryId] : undefined;
  const norm = normalizeStore(rawStoreName, rawStoreSlug, categoryFromId);

  // Определение типа клиента с защитой от конфликтов
  const customerResolution = resolveCustomerType(raw.customerType, raw.name, raw.description);

  const details = resolveOfferDetails(
    raw.name,
    raw.description,
    raw.discount,
    cleanCode,
    customerResolution.customerType === "new_customers",
    norm.name
  );

  // Извлечение erid из ссылки
  const eridMatch = (raw.gotolink || "").match(/erid=([a-zA-Z0-9_-]+)/);
  const erid = eridMatch ? eridMatch[1] : "";
  const ordText = erid ? `Реклама. ${norm.name}, erid: ${erid}` : `Реклама. ${norm.name}`;

  // Проверка статуса истечения
  let status: "active" | "expired" = "active";
  if (raw.dateEnd && raw.dateEnd !== "None") {
    const cleanDate = raw.dateEnd.replace(" ", "T");
    const endTs = new Date(cleanDate).getTime();
    if (!isNaN(endTs) && endTs < Date.now()) {
      status = "expired";
    }
  }

  const isHit = Boolean(
    (details.discount && details.discount.unit === "percent" && (details.discount.value || 0) >= 30) ||
      (details.discount && details.discount.unit === "rub" && (details.discount.value || 0) >= 500) ||
      details.type === "subscription" ||
      details.type === "gift"
  );

  return {
    id: raw.id,
    admitadId: String(raw.id),
    campaignId: raw.advcampaignId,
    store: {
      id: 90000 + (parseInt(raw.advcampaignId, 10) || raw.id % 10000),
      name: norm.name,
      slug: rawStoreSlug,
      logo: raw.logo || null,
      category: norm.category,
      categorySlug: norm.categorySlug,
      site: raw.rawCampaignSite || raw.gotolink,
    },
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
    dateStart: raw.dateStart,
    dateEnd: raw.dateEnd && raw.dateEnd !== "None" ? raw.dateEnd.slice(0, 10) : null,
    isHit,
    isUniversal: true,
    isPersonal: false,
    affiliate: {
      url: (raw.gotolink || raw.rawCampaignSite || "").replace(/&amp;/g, "&"),
      ordMarker: erid,
      ordText,
    },
    status,
  };
}

/**
 * Валидатор нормализованного оффера
 */
export function validateOffer(offer: NormalizedOffer): boolean {
  if (!offer.id || !offer.store.name || !offer.store.slug) return false;
  if (!offer.affiliate.url && !offer.store.site) return false;
  if (offer.status === "expired") return false;
  return true;
}

/**
 * Дедупликатор офферов (сохраняет все уникальные промокоды и акции)
 */
export function deduplicateOffers(offers: NormalizedOffer[]): NormalizedOffer[] {
  const seen = new Set<string>();
  const result: NormalizedOffer[] = [];

  for (const o of offers) {
    const discKey = o.discount ? o.discount.formatted : o.gift || o.title;
    const promoOrId = o.promoCode ? o.promoCode : `${discKey}-${o.id}`;
    const key = `${o.store.slug}-${promoOrId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(o);
    }
  }

  return result;
}

/**
 * Адаптер: конвертация NormalizedOffer в проектный Coupon
 */
export function toCoupon(offer: NormalizedOffer): Coupon {
  const store: Store = {
    id: offer.store.id,
    name: offer.store.name,
    slug: offer.store.slug,
    logo: offer.store.logo,
    category: offer.store.category,
    categorySlug: offer.store.categorySlug,
    about: `${offer.store.name} — официальный магазин-партнёр. Актуальные скидки и промокоды.`,
    conditions: offer.shortDescription,
    site: offer.store.site,
    activeBloggers: 500,
  };

  const bonusName =
    offer.type === "gift"
      ? offer.title
      : offer.discount
      ? offer.discount.formatted
      : offer.title;

  const promocode: Promocode = {
    id: offer.id,
    code: offer.promoCode || "",
    bonusName,
    terms: offer.shortDescription,
    expires: offer.dateEnd,
    isHit: offer.isHit,
    isUniversal: offer.isUniversal,
    isFirstOrderOnly: offer.customerType === "new_customers",
    customerTypeLabel: offer.customerTypeLabel,
    minimumOrder: offer.minimumOrder,
    region: "RU",
    isBarcode: false,
    barcodeImage: null,
    group: "admitad",
  };

  const affiliate: Affiliate = {
    link: offer.affiliate.url,
    landingLink: offer.affiliate.url,
    ordMarker: offer.affiliate.ordMarker,
    ordText: offer.affiliate.ordText,
  };

  return {
    id: offer.id,
    promocode,
    store,
    affiliate,
    extraLinks: [],
  };
}
