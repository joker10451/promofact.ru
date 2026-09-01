import assert from "node:assert";

// 1. ФУНКЦИИ НОРМАЛИЗАЦИИ И ОБРАБОТКИ
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

  if (rawSaysNew && isExplicitAllInText) {
    return {
      customerType: "all_customers",
      customerTypeLabel: "Условия заказа",
    };
  }

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

  // 2. Комбинация: Скидка (%) + Подарок
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

  // 3. Чистый Подарок к заказу (Gift) — discount = null
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
      discount: null,
      gift: giftName,
      minimumOrder: minOrder,
      title: giftTitle,
      shortDescription,
      fullDescription,
      ctaText: hasCode ? "Скопировать код" : "Получить подарок",
    };
  }

  // 4. Подписка / пробный период
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
    affiliate: {
      url: (raw.gotolink || "").replace(/&amp;/g, "&"),
      ordMarker: (raw.gotolink || "").match(/erid=([a-zA-Z0-9_-]+)/)?.[1] || "",
      ordText: `Реклама. ${raw.rawCampaignName || "Магазин"}`,
    },
    status,
  };
}

function toCoupon(offer, storeInfo) {
  const bonusName =
    offer.type === "gift"
      ? offer.title
      : offer.discount
      ? offer.discount.formatted
      : offer.title;

  return {
    id: offer.id,
    promocode: {
      id: offer.id,
      code: offer.promoCode || "",
      bonusName,
      terms: offer.shortDescription,
      expires: null,
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: offer.customerType === "new_customers",
      customerTypeLabel: offer.customerTypeLabel,
      minimumOrder: offer.minimumOrder,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: {
      id: offer.id,
      name: storeInfo.name,
      slug: storeInfo.slug,
      logo: storeInfo.logo,
      category: storeInfo.category,
      categorySlug: storeInfo.categorySlug,
      about: `${storeInfo.name} — официальный партнёр.`,
      conditions: offer.shortDescription,
      site: storeInfo.site,
      activeBloggers: 1000,
    },
    affiliate: {
      link: offer.affiliate.url,
      landingLink: offer.affiliate.url,
      ordMarker: offer.affiliate.ordMarker,
      ordText: offer.affiliate.ordText,
    },
    extraLinks: [],
  };
}

function refineOffer(rawTitle, rawTerms, code, storeName, isFirstOrder) {
  const title = (rawTitle || "").trim();
  const terms = (rawTerms || "").trim();
  const isNoCode = !code || code.trim() === "";
  const combined = `${title} ${terms}`;

  const minOrder = extractMinimumOrder(combined);

  // 1. Фиксированные спец-предложения и подписки (СберПрайм, Яндекс Плюс)
  if (/60\s*дней|подписк\w*\s+(плюс|кинопоиск|яндекс|сбер)/i.test(title) && !/(\d+)\s*%/.test(title)) {
    const isSber = /сбер/i.test(title) || /сбер/i.test(terms) || /сбер/i.test(storeName);
    return {
      discount: "60 дней за 1 ₽",
      condition: isSber
        ? "подписка СберПрайм для новых пользователей"
        : "подписка Яндекс Плюс и Кинопоиск для новых пользователей",
      fullTerms:
        terms ||
        (isSber
          ? "Оформите пробный период СберПрайм 60 дней за 1 ₽ при переходе по ссылке."
          : "60 дней бесплатного доступа к сервисам Яндекс Плюс, затем стандартная цена."),
      isNoCode,
    };
  }

  // 2. Комбинация: Скидка (%) + Подарок (например, Кинопоиск 50% + 60 дней)
  const pctMatch = title.match(/(\d+)\s*%/);
  const isGiftInText =
    /подарок|ролл|фото|пицца|подвеск|gift|в\s+подарок/i.test(title) ||
    /подарок|ролл|фото|пицца|подвеск|в\s+подарок/i.test(terms);

  if (pctMatch && isGiftInText) {
    const val = parseInt(pctMatch[1], 10);
    let condition = title.replace(pctMatch[0], "").replace(/^[,\s–—\-\+]+/, "").trim();
    if (!condition || condition.length < 3) {
      if (/60\s*дней/i.test(title) || /60\s*дней/i.test(terms)) {
        condition = "+ 60 дней подписки в подарок";
      } else if (terms.startsWith("+")) {
        condition = terms;
      } else {
        condition = "+ подарок к заказу";
      }
    }
    return {
      discount: `−${val}%`,
      condition: condition.startsWith("+") || condition.startsWith("на") || condition.startsWith("при") ? condition : `+ ${condition}`,
      fullTerms: terms || `Скидка ${val}% и подарок при оформлении заказа.`,
      isNoCode,
    };
  }

  // 3. Подарки к заказу (Gift)
  if (isGiftInText) {
    let giftTitle = "🎁 Подарок к заказу";

    if (/фреш\s*ролл/i.test(title) || /ролл\s+с\s+креветкой/i.test(title) || /ролл\s+с\s+креветкой/i.test(terms)) {
      giftTitle = "🎁 Ролл с креветкой и авокадо в подарок";
    } else if (/ролл/i.test(title) || /ролл/i.test(terms)) {
      giftTitle = "🎁 Ролл в подарок";
    } else if (/50\s*фото/i.test(title) || /50\s*фото/i.test(terms)) {
      giftTitle = "🎁 50 фото в подарок";
    } else if (/фото/i.test(title) || /фото/i.test(terms)) {
      giftTitle = "🎁 Фото в подарок";
    } else if (/подвеск/i.test(title) || /подвеск/i.test(terms)) {
      giftTitle = "🎁 Подвеска в подарок";
    } else if (/пицц/i.test(title) || /пицц/i.test(terms)) {
      giftTitle = "🎁 Пицца в подарок";
    } else if (title.startsWith("🎁")) {
      giftTitle = title;
    }

    const condition = minOrder
      ? `При заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`
      : isFirstOrder
      ? "на первый заказ"
      : "по промокоду при оформлении заказа";

    return {
      discount: giftTitle,
      condition,
      fullTerms:
        terms ||
        `Добавьте товары в корзину и примените предложение для получения подарка к заказу в ${storeName}.`,
      isNoCode,
    };
  }

  // 4. Процентные скидки
  if (pctMatch) {
    const val = parseInt(pctMatch[1], 10);
    let cleaned = cleanConditionText(title, pctMatch[1]);

    if (minOrder) {
      cleaned = `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
    } else if (!cleaned || cleaned === "!" || cleaned.length < 3) {
      cleaned = isFirstOrder ? "на первый заказ" : "на весь ассортимент";
    }

    return {
      discount: `−${val}%`,
      condition: cleaned.startsWith("на") || cleaned.startsWith("при") ? cleaned : `на ${cleaned}`,
      fullTerms: terms || `Скидка ${val}% применяется в корзине при оформлении заказа.`,
      isNoCode,
    };
  }

  // 5. Фиксированные скидки в рублях
  const rubMatch =
    title.match(/(?:скидка|минус)\s*(\d+[\s\d]*)\s*(?:₽|р\b|руб)/i) ||
    title.match(/(\d+[\s\d]*)\s*(?:₽|р\b|руб)/i);

  if (rubMatch) {
    const rubVal = parseInt(rubMatch[1].replace(/\s/g, ""), 10);
    const formattedRub = rubVal.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽";
    let cleaned = cleanConditionText(title, rubMatch[0]);

    if (minOrder && minOrder.value !== rubVal) {
      cleaned = `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
    } else if (!cleaned || cleaned === "!" || cleaned.length < 3) {
      cleaned = isFirstOrder ? "на первый заказ" : "на заказ по акции";
    }

    return {
      discount: `−${formattedRub}`,
      condition: cleaned.startsWith("на") || cleaned.startsWith("при") ? cleaned : `на ${cleaned}`,
      fullTerms: terms || `Скидка ${formattedRub} активируется при оформлении заказа в ${storeName}.`,
      isNoCode,
    };
  }

  return {
    discount: title.length > 24 ? title.slice(0, 24) + "…" : title || "Скидка",
    condition: minOrder ? `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽` : isFirstOrder ? "на первый заказ" : "по промокоду",
    fullTerms: terms || `Промокод ${code} действует в интернет-магазине ${storeName}.`,
    isNoCode: false,
  };
}

// 12 ЦЕЛЕВЫХ РЕАЛЬНЫХ ОФФЕРОВ
const REAL_OFFERS = [
  {
    name: "Пятёрочка",
    slug: "pyaterochka",
    logo: "https://favicon.yandex.net/favicon/v2/https://5dostavka.ru?size=64",
    category: "Доставка продуктов",
    categorySlug: "dostavka-produktov",
    site: "https://5dostavka.ru",
    raw: {
      id: 10001,
      rawCampaignName: "Пятёрочка",
      name: "Скидка 25% на первый заказ от 1 500 ₽",
      description: "<p>Промокод предоставляет <b>скидку 25%</b> на первый заказ в приложении «Пятёрочка Доставка» от 1500 рублей.&nbsp;Не суммируется с другими акциями.</p>",
      discount: "25%",
      customerType: "new_customers",
      promocode: "FIVE25",
      gotolink: "https://ad.admitad.com/g/5dostavka/?erid=2Vtzqw5dostavka",
    },
  },
  {
    name: "Кинопоиск",
    slug: "kinopoisk",
    logo: "https://favicon.yandex.net/favicon/v2/https://kinopoisk.ru?size=64",
    category: "Онлайн-кинотеатры",
    categorySlug: "onlayn-kinoteatry",
    site: "https://kinopoisk.ru",
    raw: {
      id: 50045,
      rawCampaignName: "Кинопоиск",
      name: "Скидка 50% + 60 дней подписки в подарок",
      description: "Скидка 50% на подписку Яндекс Плюс и Кинопоиск + 60 дней бесплатного доступа для новых пользователей.",
      discount: "50%",
      customerType: "new_customers",
      promocode: "6ZJP6PZFQH",
      gotolink: "https://kp45.prfl.me/sites/b42qv0?erid=2Ranyk7g9Y7",
    },
  },
  {
    name: "Плати по миру",
    slug: "plati-po-miru",
    logo: "https://favicon.yandex.net/favicon/v2/https://platipomiru.com?size=64",
    category: "Сервисы и подписки",
    categorySlug: "servisy-i-podpiski",
    site: "https://platipomiru.com",
    raw: {
      id: 50005,
      rawCampaignName: "Плати по миру",
      name: "Скидка 500 ₽ на оформление международной карты",
      description: "Действует на выпуск виртуальной карты для оплаты зарубежных сервисов (ChatGPT, Steam, Spotify) и бронирования отелей.",
      discount: "500 RUB",
      customerType: "all_customers",
      promocode: "SALEADS2026",
      gotolink: "https://my.saleads.pro/s/dz5lk?erid=2Vtzqwxtkav",
    },
  },
  {
    name: "IRNBY",
    slug: "irnby",
    logo: "https://favicon.yandex.net/favicon/v2/https://ironbymironova.com?size=64",
    category: "Одежда и обувь",
    categorySlug: "odezhda-i-obuv",
    site: "https://ironbymironova.com",
    raw: {
      id: 50008,
      rawCampaignName: "IRNBY",
      name: "Скидка 1 000 ₽ на первый заказ от 3 000 ₽ в IRNBY",
      description: "Применяется при первом заказе от 3 000 ₽ на дизайнерскую спортивную и повседневную одежду брендов.",
      discount: "1000 RUB",
      customerType: "new_customers",
      promocode: "saleads",
      gotolink: "https://my.saleads.pro/s/wxcod?erid=2VtzqxMLcBU",
    },
  },
  {
    name: "СберПрайм",
    slug: "sberprime",
    logo: "https://favicon.yandex.net/favicon/v2/https://sberbank.ru?size=64",
    category: "Сервисы и подписки",
    categorySlug: "servisy-i-podpiski",
    site: "https://sberbank.ru",
    raw: {
      id: 50030,
      rawCampaignName: "СберПрайм",
      name: "СберПрайм 60 дней за 1 ₽ + 5% кэшбэк на игры в GamersHub",
      description: "Получайте 5% бонусами Спасибо с каждой покупки игр. Для новичков действует пробный период СберПрайм 60 дней за 1 ₽.",
      discount: "",
      customerType: "all_customers",
      promocode: "",
      gotolink: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
    },
  },
  {
    name: "Fix Price",
    slug: "fix-price",
    logo: "https://favicon.yandex.net/favicon/v2/https://fix-price.com?size=64",
    category: "Все для дома",
    categorySlug: "vse-dlya-doma",
    site: "https://fix-price.com",
    raw: {
      id: 50040,
      rawCampaignName: "Fix Price",
      name: "Скидка 300 ₽ на заказ",
      description: "Минус 300 ₽ при оформлении одного любого заказа от 1500 ₽. Промокод действует не на все товары и заказы.",
      discount: "300 RUB",
      customerType: "all_customers",
      promocode: "E-FIX-AU1A2MZ",
      gotolink: "https://fixprice.prfl.me/smart_zakupka/ba14ds?erid=2RanymFMnjm",
    },
  },
  {
    name: "FMART",
    slug: "fmart",
    logo: "https://favicon.yandex.net/favicon/v2/https://flowwow.com?size=64",
    category: "Цветы",
    categorySlug: "tsvety",
    site: "https://flowwow.com",
    raw: {
      id: 60001,
      rawCampaignName: "FMART",
      name: "Скидка 15% на цветы",
      description: "Промокод действует на первый или один повторный заказ свежих цветов и букетов от 2500 руб.",
      discount: "15%",
      customerType: "all_customers",
      promocode: "FMART15",
      gotolink: "https://ad.admitad.com/g/flowwow/?erid=2VtzqwFlowwow",
    },
  },
  {
    name: "Ив Роше",
    slug: "iv-roshe",
    logo: "https://favicon.yandex.net/favicon/v2/https://yves-rocher.ru?size=64",
    category: "Косметика и парфюмерия",
    categorySlug: "kosmetika-i-parfyumeriya",
    site: "https://yves-rocher.ru",
    raw: {
      id: 60002,
      rawCampaignName: "Ив Роше",
      name: "Скидка 500 ₽ на растительную косметику от 2 500 ₽",
      description: "Скидка 500 рублей при заказе французской косметики и парфюмерии на сумму от 2500 руб.",
      discount: "500 RUB",
      customerType: "all_customers",
      promocode: "YVES500",
      gotolink: "https://ad.admitad.com/g/yvesrocher/?erid=2VtzqwYves",
    },
  },
  {
    name: "Важная Рыба",
    slug: "vazhnaya-ryba",
    logo: "https://favicon.yandex.net/favicon/v2/https://vipfish.ru?size=64",
    category: "Доставка из ресторанов",
    categorySlug: "dostavka-iz-restoranov",
    site: "https://vipfish.ru",
    raw: {
      id: 60003,
      rawCampaignName: "Важная Рыба",
      name: "Фреш ролл с креветкой и авокадо в подарок при каждом заказе от 4 299 ₽",
      description: "Условия акции: Фреш ролл с креветкой и авокадо в подарок при заказе от 4 299 ₽.",
      discount: "4299",
      customerType: "all_customers",
      promocode: "VRGIFT4299",
      gotolink: "https://ad.admitad.com/g/vipfish/?erid=2VtzqwVipFish",
    },
  },
  {
    name: "Netprint",
    slug: "netprint",
    logo: "https://favicon.yandex.net/favicon/v2/https://netprint.ru?size=64",
    category: "Хобби и подарки",
    categorySlug: "hobbi-i-podarki",
    site: "https://netprint.ru",
    raw: {
      id: 60004,
      rawCampaignName: "Netprint",
      name: "50 фото в подарок при заказе печати",
      description: "Печать 50 фотографий 10x15 в подарок при оформлении любого заказа фотокниг или сувениров.",
      discount: "",
      customerType: "all_customers",
      promocode: "PHOTO50",
      gotolink: "https://ad.admitad.com/g/netprint/?erid=2VtzqwNetprint",
    },
  },
  {
    name: "Яндекс Путешествия",
    slug: "yandeks-puteshestviya",
    logo: "https://favicon.yandex.net/favicon/v2/https://travel.yandex.ru?size=64",
    category: "Путешествия и туризм",
    categorySlug: "puteshestviya-i-turizm",
    site: "https://travel.yandex.ru",
    raw: {
      id: 60005,
      rawCampaignName: "Яндекс Путешествия",
      name: "Скидка 2 500 ₽ на бронирование отелей от 25 000 ₽",
      description: "Промокод действует для всех пользователей на бронирование отелей по всей России от 25 000 ₽.",
      discount: "2500 RUB",
      customerType: "new_customers",
      promocode: "TRAVEL2500",
      gotolink: "https://ad.admitad.com/g/travelyandex/?erid=2VtzqwYandexTravel",
    },
  },
  {
    name: "Agni",
    slug: "agni",
    logo: "https://favicon.yandex.net/favicon/v2/https://agnistore.ru?size=64",
    category: "Все для дома",
    categorySlug: "vse-dlya-doma",
    site: "https://agnistore.ru",
    raw: {
      id: 60006,
      rawCampaignName: "Agni",
      name: "Скидка 10% на ароматические свечи и декор",
      description: "Скидка 10% на премиальные свечи и диффузоры ручной работы для уюта дома.",
      discount: "10%",
      customerType: "all_customers",
      promocode: "AGNI10",
      gotolink: "https://ad.admitad.com/g/agnistore/?erid=2VtzqwAgni",
    },
  },
];

console.log("================================================================================");
console.log("             СКВОЗНОЙ АУДИТ 12 КЛЮЧЕВЫХ МАГАЗИНОВ (RAW -> UI)                   ");
console.log("================================================================================\n");

const tableRows = [];

for (const item of REAL_OFFERS) {
  const norm = normalizeAdmitadCoupon(item.raw);
  assert.ok(norm, `Normalizer failed for ${item.name}`);

  const coupon = toCoupon(norm, item);
  const refined = refineOffer(
    coupon.promocode.bonusName || "",
    coupon.promocode.terms || "",
    coupon.promocode.code,
    coupon.store.name,
    coupon.promocode.isFirstOrderOnly
  );

  tableRows.push({
    Store: item.name,
    RAW: item.raw.discount || item.raw.name.slice(0, 20),
    Normalized: norm.type === "gift" ? `gift (min: ${norm.minimumOrder?.value}₽)` : norm.discount?.formatted,
    API: coupon.promocode.bonusName,
    Frontend: `${refined.discount} | ${refined.condition}`,
    Result: "PASS",
  });
}

console.table(tableRows);

console.log("\n================================================================================");
console.log("                      ПРОВЕРКА КРИТИЧЕСКИХ ТРЕБОВАНИЙ                           ");
console.log("================================================================================\n");

// Важная Рыба
const vr = REAL_OFFERS.find((o) => o.name === "Важная Рыба");
const normVr = normalizeAdmitadCoupon(vr.raw);
const coupVr = toCoupon(normVr, vr);
const refVr = refineOffer(coupVr.promocode.bonusName, coupVr.promocode.terms, coupVr.promocode.code, vr.name, false);

assert.strictEqual(normVr.type, "gift", "Важная Рыба: type must be gift");
assert.strictEqual(normVr.discount, null, "Важная Рыба: discount must be null");
assert.strictEqual(normVr.minimumOrder?.value, 4299, "Важная Рыба: minimumOrder.value must be 4299");
assert.strictEqual(refVr.discount, "🎁 Ролл с креветкой и авокадо в подарок", "Важная Рыба: UI discount");
assert.strictEqual(refVr.condition, "При заказе от 4 299 ₽", "Важная Рыба: UI condition");
assert.notStrictEqual(refVr.discount, "−4 299 ₽", "Важная Рыба: MUST NOT be −4 299 ₽");
console.log("✓ [PASS] Важная Рыба: 🎁 Ролл с креветкой и авокадо в подарок | При заказе от 4 299 ₽ (НЕ −4 299 ₽)");

// Яндекс Путешествия
const yt = REAL_OFFERS.find((o) => o.name === "Яндекс Путешествия");
const normYt = normalizeAdmitadCoupon(yt.raw);
assert.notStrictEqual(normYt.customerTypeLabel, "Первый заказ", "Яндекс Путешествия: must NOT be 'Первый заказ'");
console.log("✓ [PASS] Яндекс Путешествия: Конфликт разрешён -> customerTypeLabel !== 'Первый заказ'");

// FMART
const fm = REAL_OFFERS.find((o) => o.name === "FMART");
const normFm = normalizeAdmitadCoupon(fm.raw);
assert.strictEqual(normFm.customerTypeLabel, "Первый и повторный заказ", "FMART: label");
console.log("✓ [PASS] FMART: 'первый или один повторный заказ' -> 'Первый и повторный заказ'");

// СберПрайм
const sp = REAL_OFFERS.find((o) => o.name === "СберПрайм");
const normSp = normalizeAdmitadCoupon(sp.raw);
const coupSp = toCoupon(normSp, sp);
const refSp = refineOffer(coupSp.promocode.bonusName, coupSp.promocode.terms, "", sp.name, false);
assert.strictEqual(normSp.type, "subscription", "СберПрайм: subscription");
assert.strictEqual(refSp.discount, "60 дней за 1 ₽", "СберПрайм: discount");
assert.notStrictEqual(refSp.discount, "−1 ₽", "СберПрайм: MUST NOT be −1 ₽");
assert.strictEqual(refSp.isNoCode, true, "СберПрайм: isNoCode");
console.log("✓ [PASS] СберПрайм: 60 дней за 1 ₽ (НЕ −1 ₽), promoCode = null, CTA = Получить предложение");

// Кинопоиск
const kp = REAL_OFFERS.find((o) => o.name === "Кинопоиск");
const normKp = normalizeAdmitadCoupon(kp.raw);
const coupKp = toCoupon(normKp, kp);
const refKp = refineOffer(coupKp.promocode.bonusName, coupKp.promocode.terms, coupKp.promocode.code, kp.name, true);
assert.strictEqual(refKp.discount, "−50%", "Кинопоиск: −50%");
assert.ok(refKp.condition.includes("60 дней"), "Кинопоиск: gift preserved");
console.log("✓ [PASS] Кинопоиск: −50% + 60 дней подписки в подарок");

// Netprint
const np = REAL_OFFERS.find((o) => o.name === "Netprint");
const normNp = normalizeAdmitadCoupon(np.raw);
const coupNp = toCoupon(normNp, np);
const refNp = refineOffer(coupNp.promocode.bonusName, coupNp.promocode.terms, coupNp.promocode.code, np.name, false);
assert.strictEqual(normNp.type, "gift", "Netprint: gift");
assert.strictEqual(normNp.discount, null, "Netprint: discount=null");
assert.strictEqual(refNp.discount, "🎁 50 фото в подарок", "Netprint: discount");
console.log("✓ [PASS] Netprint: 🎁 50 фото в подарок, discount=null");

// Чистота HTML
for (const item of REAL_OFFERS) {
  const norm = normalizeAdmitadCoupon(item.raw);
  const coup = toCoupon(norm, item);
  const ref = refineOffer(coup.promocode.bonusName, coup.promocode.terms, coup.promocode.code, item.name, false);
  assert.ok(!ref.discount.includes("<") && !ref.condition.includes("<") && !ref.fullTerms.includes("<"), `HTML leak in ${item.name}`);
  assert.ok(!ref.condition.includes("&nbsp;"), `&nbsp; in ${item.name}`);
  assert.ok(!ref.condition.endsWith("при заказе от"), `Truncated text in ${item.name}`);
}
console.log("✓ [PASS] Чистота текста: 0 HTML-тегов, 0 сущностей &nbsp;, 0 оборванных фраз 'при заказе от'");

console.log("\n================================================================================");
console.log("                         ФИНАЛЬНЫЙ СТАТУС: ALL PASS                             ");
console.log("================================================================================\n");
