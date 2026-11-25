import { extractMinimumOrder } from "@/lib/admitadNormalizer";
import { isRealPromoCode } from "@/lib/dedupe";

/**
 * Модуль семантической очистки и обогащения условий акций (Offer Refiner).
 * Превращает сырые обрывки и опечатки из CPA-фидов в понятный, красивый русский текст.
 */

export type OfferType = "percent" | "rub" | "gift" | "subscription" | "default";

export interface RefinedOffer {
  type: OfferType;
  discount: string;
  condition: string;
  fullTerms: string;
  isNoCode: boolean;
  /** Advertiser mentions a promo code but supplies none in the partner feed. */
  missingCodeClaim?: boolean;
}

export function refineOffer(
  rawTitle: string,
  rawTerms: string,
  code: string,
  storeName: string,
  isFirstOrder: boolean
): RefinedOffer {
  // Эмодзи в начале приходят из старых импортов («🎁 Подарок к заказу»):
  // в интерфейсе вместо них иконки.
  const title = (rawTitle || "").trim()
    .replace(/^[\p{Extended_Pictographic}️\s]+/u, "")
    .replace(/(^|[\s,.:;!?-])на\s+се(?=[\s,.:;!?-]|$)/gi, "$1на все")
    .replace(/(^|[\s,.:;!?-])се(?=[\s,.:;!?-]|$)/gi, "$1все");
  const terms = (rawTerms || "").trim()
    .replace(/(^|[\s,.:;!?-])на\s+се(?=[\s,.:;!?-]|$)/gi, "$1на все")
    .replace(/(^|[\s,.:;!?-])се(?=[\s,.:;!?-]|$)/gi, "$1все");
  const isNoCode = !isRealPromoCode(code);

  // Approved Magnit placement: preserve first-order, pickup and both basket thresholds
  // in the visible offer card; the generic single-minimum normalizer would drop them.
  if (storeName === "Магнит Доставка" && ["25GFC1TL4", "SGPFB7JJGY", "SGPF1VUSP76", "Дождь", "НОЯБРЬ"].includes(code) && /^Скидка 31%|^Скидка 26%/iu.test(title)) {
    const value = title.match(/Скидка\s+(\d+)%/iu)?.[1];
    if (value) return {
      type: "percent", discount: `−${value}%`,
      condition: title.replace(/^Скидка\s+\d+%\s*/iu, "").trim(),
      fullTerms: terms || title,
      isNoCode,
    };
  }

  // No verified benefit: do not render a tautological "по промокоду" tagline.
  if (/размер бонуса уточняется/iu.test(title)) {
    return { type: "default", discount: "Размер бонуса уточняется",
      condition: `Промокод «${code}»: условия проверьте в приложении`,
      fullTerms: terms || "Проверьте размер бонуса до оформления заказа.", isNoCode };
  }


  // A free-shipping minimum (e.g. 3,000 ₽) is not a ruble discount.
  if (/^Бесплатная доставка/iu.test(title) && /бесплатн[а-яё]*\s+доставк/iu.test(terms)) {
    const minimum = extractMinimumOrder(title + " " + terms);
    return { type: "default", discount: "Бесплатная доставка",
      condition: minimum ? "При заказе от " + minimum.value.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽" : "По условиям магазина",
      fullTerms: terms, isNoCode };
  }

  // A service advertised "from 2,000 rubles" has a PRICE, not a discount.
  if (/^3D-диагностика\s+и\s+массаж\s+лица\s*[—–-]\s*от\s*2\s*000\s*₽/iu.test(title)) {
    return { type: "default", discount: "3D-диагностика и массаж лица",
      condition: "Стоимость от 2 000 ₽ · Москва", fullTerms: terms, isNoCode };
  }
  // 50% applies only to optional cosmetic purchases after a FREE diagnostic.
  if (title === "Бесплатная диагностика кожи" &&
      /купить\s+косметику\s+со\s+скидкой\s+50\s*%/iu.test(terms)) {
    return { type: "default", discount: title,
      condition: "После процедуры косметику можно купить со скидкой 50%",
      fullTerms: terms, isNoCode };
  }
  // Professional scheme is a future-month benefit, not immediate checkout -40%.
  if (/^−40%\s+на\s+заказ\s+следующего\s+месяца\s+для\s+мастеров/iu.test(title) &&
      /подтверждающ[а-яё]*\s+документ\s+специалиста/iu.test(terms)) {
    return { type: "percent", discount: "−40%",
      condition: "На заказ следующего месяца после подтверждения статуса мастера",
      fullTerms: terms, isNoCode };
  }

  // A loyalty program accumulates future rewards; its ceiling is NOT
  // an instant percentage discount applied at checkout.
  if (/накопительн[а-яё]*\s+(?:программ[а-яё]*|систем[а-яё]*|скидк[а-яё]*)/iu.test(title)) {
    const reward = terms.match(/за\s+каждые\s+([\d\s]+)\s+рубл[а-яё]*[\s\S]{0,90}?\+(\d{1,2})\s*%/iu);
    return {
      type: "default",
      discount: title,
      condition: reward
        ? "За каждые " + Number(reward[1].replace(/\s/g, "")).toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽ — +" + reward[2] + "% к будущей скидке"
        : "Накопление скидки на будущие заказы",
      fullTerms: terms || title,
      isNoCode,
    };
  }
  // Admitad sometimes supplies a campaign title "по промокоду", while the
  // actual coupon field says "НЕ НУЖЕН". Never present that as a guaranteed
  // discount by link or as a copyable code. Prefer the specific source terms.
  const explicitlyNoCode = /(?:в(?:в)?вод\s+промокода\s+не\s+требуется|промокод\s+не\s+(?:нужен|требуется)|без\s+промокода)/iu.test(terms);
  const missingCodeClaim = isNoCode && !explicitlyNoCode &&
    /(?:^|\s)по\s+промокод[а-яё]*/i.test(title);
  if (missingCodeClaim) {
    return {
      type: "default",
      discount: cleanTruncate(terms || "Уточните условия предложения", 55),
      condition: "В источнике промокод не указан",
      fullTerms: terms || "Уточните условия у магазина перед оформлением заказа.",
      isNoCode: true,
      missingCodeClaim: true,
    };
  }
  const combined = `${title} ${terms}`;

  const minOrder = extractMinimumOrder(combined);

  // Two-tier subscription PRICES are not monetary savings.
  const plusTrial = storeName === "Яндекс Плюс"
    ? title.match(/(\d+)\s*дн(?:ей|я|ь)[\s\S]*?бесплатн[а-яё]*\s+или\s+(\d+)\s*дн(?:ей|я|ь)\s+за\s+(\d+)\s*(?:₽|руб)/iu)
    : null;
  if (plusTrial) {
    return {
      type: "subscription",
      discount: `${plusTrial[1]} дней бесплатно / ${plusTrial[2]} дней за ${plusTrial[3]} ₽`,
      condition: "45 дней — новым пользователям; 30 дней — без активной подписки",
      fullTerms: terms || title,
      isNoCode,
    };
  }
  // 1. Фиксированные спец-предложения и подписки (Иви, СберПрайм, Яндекс Плюс, Start.ru, Premier)
  // Банковские карты («120 дней без %») не являются подписками.
  const daysMatch = title.match(/(\d+)\s*(?:дней|дня|день)/i);
  if (
    (daysMatch || /подписк/i.test(title)) &&
    !/(\d+)\s*%/.test(title) &&
    !/кредитн[а-яё]*\s+карт|дебетов[а-яё]*\s+карт|без\s*%/iu.test(title) &&
    /подписк|доступ|пробн|бесплатн|кинотеатр/i.test(combined)
  ) {
    // Не выводим цену, срок или аудиторию, которых нет в данных рекламодателя.
    const priceMatch = combined.match(/(?:за|по цене)\s*(\d[\d\s]*)\s*(₽|руб(?:лей|ля|\.)?)/i);
    const explicitlyFree = /(?:бесплатн|за\s*0\s*₽)/i.test(combined);
    const duration = daysMatch?.[1];
    const price = priceMatch ? `${Number(priceMatch[1].replace(/\s/g, "")).toLocaleString("ru-RU")} ₽` : null;
    const disc = duration
      ? `${duration} дней${explicitlyFree ? " бесплатно" : price ? ` за ${price}` : " доступа"}`
      : cleanTruncate(title || terms || `Подписка ${storeName}`, 55);
    return {
      type: "subscription",
      discount: disc,
      condition: isFirstOrder ? "для новых пользователей" : "Условия подписки уточняйте у магазина",
      fullTerms: terms || title || "Уточните условия подписки у магазина.",
      isNoCode,
    };
  }

  // 1.5. Банковские карты (льготный период, рассрочка 0%, кэшбэк по картам)
  if (/(?:(?:кредитн|дебетов)[а-яё]*(?:\s+[а-яёa-z0-9]+){0,2}[\s-]+карт|(?:альфа-карт|сберкарт))/iu.test(title)) {
    const afterColon = title.includes(":") ? title.split(":").slice(1).join(":").trim() : title;
    const graceMatch = title.match(/(\d+)\s*дн(?:ей|я|ь)\s+без\s*%/iu);
    if (graceMatch) {
      const cond = afterColon
        .replace(/^(?:честный\s+)?(?:до\s+)?\d+\s*дн(?:ей|я|ь)\s+без\s*%(?:\s+на\s+любые\s+покупки)?/iu, "")
        .replace(/^(?:\s*и\s+)|(?:\s+и\s*$)/gi, "")
        .trim();
      return {
        type: "default",
        discount: `${graceMatch[1]} дней без %`,
        condition: cond || "Льготный период на покупки",
        fullTerms: terms || title,
        isNoCode,
      };
    }
    const zeroInstallment = title.match(/рассрочк[а-яё]*\s*0%\s*до\s*(\d+)\s*мес[а-яё]*/iu);
    if (zeroInstallment) {
      const cond = afterColon
        .replace(/рассрочк[а-яё]*\s*0%\s*до\s*\d+\s*мес[а-яё]*/iu, "")
        .replace(/(?:^\s*и\s+|\s+и\s*$)/gi, "")
        .trim();
      return {
        type: "default",
        discount: `Рассрочка 0% до ${zeroInstallment[1]} мес.`,
        condition: cond || "По условиям карты",
        fullTerms: terms || title,
        isNoCode,
      };
    }
    const cardCashback = title.match(/к[еэ]шб[еэ]к[а-яё]*\s*(до\s*)?([1-9]\d*)\s*%/iu);
    if (cardCashback) {
      const cond = afterColon
        .replace(/(?:супер)?к[еэ]шб[еэ]к[а-яё]*\s*(?:до\s*)?[1-9]\d*\s*%/iu, "")
        .replace(/(?:^\s*и\s+|\s+и\s*$)/gi, "")
        .trim();
      return {
        type: "percent",
        discount: `Кешбэк ${cardCashback[1] ? "до " : ""}${cardCashback[2]}%`,
        condition: cond || "По условиям карты",
        fullTerms: terms || title,
        isNoCode,
      };
    }
  }

  // 2. Комбинация: Скидка (%) + Подарок (например, Кинопоиск 50% + 60 дней)
  // Игнорируем 0% (рассрочка 0% — не скидка −0%) и десятичные процентные ставки по вкладам («13,5% годовых»).
  const stripNonDiscountPct = (s: string) =>
    s.replace(/\d+[,.]\d+\s*%/g, "").replace(/ставк[а-яё]*\s*(?:до\s*)?\d+\s*%/gi, "");
  const pctMatch = stripNonDiscountPct(title).match(/([1-9]\d*)\s*%/) || stripNonDiscountPct(terms).match(/([1-9]\d*)\s*%/);
  const hasExplicitRubDiscount = /(?:скидка|минус)\s*(?:\d[\d\s]*\s*(?:₽|р\b|руб))/i.test(title);
  // «подарков» и «ролл(ов)/пицц(ы)» в перечне товаров («цветов и подарков», «пиццы, сетов и роллов») —
  // не подарок к заказу; учитываем именно формулировки выдачи подарка.
  const giftPhraseRe = /(?:^|[^а-яё])(?:в\s+подарок|подарок|подарк[аи]|дарим|gift)(?=$|[^а-яё])|50\s*фото|подвеск[аиу]?\s+(?:в\s+подарок|бесплатно)/iu;
  const isGiftInText = giftPhraseRe.test(title) || giftPhraseRe.test(terms);

  if (pctMatch && isGiftInText) {
    const val = parseInt(pctMatch[1], 10);
    let condition = cleanConditionText(title, pctMatch[0]);
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
      type: "percent",
      discount: `−${val}%`,
      condition: condition.startsWith("+") || condition.startsWith("на") || condition.startsWith("при") ? condition : `+ ${condition}`,
      fullTerms: terms || `Скидка ${val}% и подарок при оформлении заказа.`,
      isNoCode,
    };
  }

  // 3.0. Подарки и товары/блюда за 1 ₽ (номинальная цена, не скидка −1 ₽)
  const oneRubleMatch = combined.match(/(?:^|[\s,.:;!?-])([а-яё\s«»"-]+?)\s+за\s+1\s*(?:₽|р\b|руб(?:ль|ля|\.)?)/iu);
  if (oneRubleMatch && !/подписк|доступ|дней|дня|день/iu.test(combined)) {
    let giftTitle = oneRubleMatch[1].trim();
    giftTitle = giftTitle.replace(/^(?:получите|заберите|выберите|акция|промокод|скидка\s+на)\s+/iu, "").trim();
    if (!giftTitle || giftTitle.length < 3) {
      giftTitle = /готов[а-яё]*\s+еда/iu.test(combined) ? "Готовая еда" : "Товар";
    }
    const formattedGift = `${giftTitle} за 1 ₽`;
    const isFirst = isFirstOrder || /перв|1[-‑–—]?[ыое]?й/i.test(combined);
    const condition = minOrder
      ? `${isFirst ? "на первый заказ" : "при заказе"} от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`
      : isFirst
      ? "на первый заказ"
      : "по промокоду при оформлении заказа";

    return {
      type: "gift",
      discount: formattedGift,
      condition,
      fullTerms: terms || `${formattedGift} в мобильном приложении или на сайте ${storeName}.`,
      isNoCode,
    };
  }

  // 3. Подарки к заказу (Gift) — срабатывает только если в заголовке нет явной денежной скидки
  if (isGiftInText && !hasExplicitRubDiscount) {
    const certMatch = title.match(/сертификат\s+на\s+(\d[\d\s]*)\s*(?:₽|р\b|руб)/iu);
    let giftTitle = /подарок\s+на\s+выбор/iu.test(combined) ? "Подарок на выбор" : "Подарок к заказу";

    if (certMatch) {
      const certAmt = Number(certMatch[1].replace(/\s/g, "")).toLocaleString("ru-RU").replace(/\u00a0/g, " ");
      giftTitle = `Сертификат ${certAmt} ₽`;
    } else if (/фреш\s*ролл/i.test(title) || /ролл\s+с\s+креветкой/i.test(title) || /ролл\s+с\s+креветкой/i.test(terms)) {
      giftTitle = "Ролл с креветкой и авокадо в подарок";
    } else if (/ролл/i.test(title) || /ролл/i.test(terms)) {
      giftTitle = "Ролл в подарок";
    } else if (/50\s*фото/i.test(title) || /50\s*фото/i.test(terms)) {
      giftTitle = "50 фото в подарок";
    } else if (/фото/i.test(title) || /фото/i.test(terms)) {
      giftTitle = "50 фото в подарок";
    } else if (/подвеск/i.test(title) || /подвеск/i.test(terms)) {
      giftTitle = "Подвеска в подарок";
    } else if (/пицц/i.test(title) || /пицц/i.test(terms)) {
      giftTitle = "Пицца в подарок";
    }

    const firstPurchaseMin = combined.match(/перв(?:ой|ого)\s+покупк[а-яё]*\s+от\s+(\d[\d\s]*)\s*(?:₽|руб)/iu);
    const condition = firstPurchaseMin
      ? `после первой покупки от ${Number(firstPurchaseMin[1].replace(/\s/g, "")).toLocaleString("ru-RU").replace(/\u00a0/g, " ")} ₽`
      : minOrder
      ? `При заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`
      : isFirstOrder
      ? "на первый заказ"
      : isNoCode ? "подарок по условиям акции на сайте" : "по промокоду при оформлении заказа";

    return {
      type: "gift",
      discount: giftTitle,
      condition,
      fullTerms:
        terms ||
        `Добавьте товары в корзину и примените предложение для получения подарка к заказу в ${storeName}.`,
      isNoCode,
    };
  }

  // 3.1. Фиксированная стоимость набора/товара («Сет ... за 599 ₽», «1 кг роллов за 1290 ₽») — цена, не скидка −599 ₽
  const setPriceMatch = !/скидк|минус|экономи|выгод|дешевле|к[еэ]шб[еэ]к|кэшбэк|бонус|сертификат|подарок|бесплатн/iu.test(title)
    ? title.match(/^(.+?)\s+за\s+(\d[\d\s]{2,})\s*(?:₽|р\b|руб(?:лей|ля|\.)?)(.*)$/iu)
    : null;
  if (
    setPriceMatch &&
    !/(?:дн(?:ей|я|ь)|месяц[а-яё]*)\s*$/iu.test(setPriceMatch[1]) &&
    !/=\s*\d/.test(title)
  ) {
    const priceNum = parseInt(setPriceMatch[2].replace(/\s/g, ""), 10);
    if (Number.isFinite(priceNum) && priceNum >= 50) {
      const formattedPrice = priceNum.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽";
      const itemLabel = cleanTruncate(setPriceMatch[1].trim(), 38);
      const tailCond = setPriceMatch[3]
        .replace(/\s+(?:в|на)\s+(?:Food\s*Band|FARFOR|Фарфор|сайте\s+и\s+в\s+приложении)\b.*$/iu, "")
        .trim();
      const condText = tailCond
        ? formatConditionPrefix(cleanConditionText(tailCond)).replace(/^на\s+/i, "")
        : isFirstOrder
        ? "на первый заказ"
        : "спеццена по промокоду";
      return {
        type: "default",
        discount: `${itemLabel} за ${formattedPrice}`,
        condition: condText,
        fullTerms: terms || title,
        isNoCode,
      };
    }
  }

  // 4. Процентные скидки
  if (pctMatch) {
    const val = parseInt(pctMatch[1], 10);

    // Кэшбэк — не скидка: «−5%» с подписью «на Кэшбек на каждую покупку»
    // обещал бы то, чего нет.
    if (/к[еэ]шб[еэ]к/i.test(combined)) {
      const rest = cleanConditionText(title, pctMatch[0]) || cleanConditionText(terms, pctMatch[0]);
      const condition = rest.replace(/(^|\s)(?:на\s+)?к[еэ]шб[еэ]к[а-яё]*/gi, " ").trim();
      return {
        type: "percent",
        discount: `Кешбэк ${val}%`,
        condition: condition.length >= 3 ? formatConditionPrefix(condition) : "на каждую покупку",
        fullTerms: terms || `Кэшбэк ${val}% за покупки в ${storeName}.`,
        isNoCode,
      };
    }
    // Передаём pctMatch[0] («15%»), а не pctMatch[1] («15»): иначе «Скидка 15»
    // вырезается, а «%» остаётся сиротой → «на % на бронирование…».
    let cleaned = cleanConditionText(title, pctMatch[0]);
    if (!cleaned || cleaned.length < 3) {
      cleaned = cleanConditionText(terms, pctMatch[0]);
    }

    if (minOrder) {
      const isFirst = isFirstOrder || /перв|1[-‑–—]?[ыое]?й/i.test(title) || /перв|1[-‑–—]?[ыое]?й/i.test(terms);
      cleaned = isFirst
        ? `на первый заказ от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`
        : `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
      // Способ получения — существенное условие: без него «−25% от 1 399 ₽»
      // выглядит как скидка на доставку, хотя действует только на самовывоз.
      if (/самовывоз/i.test(title) && !/доставк/i.test(title)) cleaned += " на самовывоз";
    } else if (!cleaned || cleaned === "!" || cleaned.length < 3) {
      cleaned = isFirstOrder ? "на первый заказ" : "на весь ассортимент";
    }

    return {
      type: "percent",
      discount: `−${val}%`,
      condition: formatConditionPrefix(cleaned),
      fullTerms: terms || `Скидка ${val}% применяется в корзине при оформлении заказа.`,
      isNoCode,
    };
  }

  // 4.5. Повышенный курс списания бонусов/баллов («1 бонус = 1,5 ₽») — не скидка −5 ₽
  const bonusRateMatch = combined.match(/(\d+\s*бонус[а-яё]*\s*=\s*\d+(?:[,.]\d+)?\s*(?:₽|руб))/iu);
  if (bonusRateMatch || /курс[а-яё]*\s+списан/iu.test(title)) {
    return {
      type: "default",
      discount: bonusRateMatch ? bonusRateMatch[1].replace(/руб\.?/iu, "₽") : cleanTruncate(title, 50),
      condition: cleanTruncate(terms || title, 90),
      fullTerms: terms || title,
      isNoCode,
    };
  }

  // 5. Фиксированные скидки в рублях (исключаем десятичные курсы вида 1,5 ₽)
  const titleNoDec = title.replace(/\d+[,.]\d+\s*(?:₽|р\b|руб\.?|рублей|рубля)/gi, "");
  const termsNoDec = terms.replace(/\d+[,.]\d+\s*(?:₽|р\b|руб\.?|рублей|рубля)/gi, "");
  const rubMatch =
    titleNoDec.match(/(?:скидка|минус)\s*(\d+[\s\d]*)\s*(?:₽|р\b|руб\.?|рублей|рубля)/i) ||
    titleNoDec.match(/(\d+[\s\d]*)\s*(?:₽|р\b|руб\.?|рублей|рубля)/i) ||
    termsNoDec.match(/(?:скидка|минус)\s*(\d+[\s\d]*)\s*(?:₽|р\b|руб\.?|рублей|рубля)/i) ||
    termsNoDec.match(/(\d+[\s\d]*)\s*(?:₽|р\b|руб\.?|рублей|рубля)/i);

  // "за 1 ₽" is a price of a subscription/trial, not a saving of 1 ₽.
  const oneRublePrice = /(?:за|по цене)\s*1\s*(?:₽|руб)/iu.test(combined) &&
    !/скидк[а-яё]*\s*1\s*(?:₽|руб)/iu.test(combined);
  if (rubMatch && !(oneRublePrice && Number(rubMatch[1].replace(/\s/g, "")) === 1)) {
    const rubVal = parseInt(rubMatch[1].replace(/\s/g, ""), 10);
    const formattedRub = rubVal.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽";
    let cleaned = cleanConditionText(title, rubMatch[0]);
    if (!cleaned || cleaned.length < 3) {
      cleaned = cleanConditionText(terms, rubMatch[0]);
    }

    if (minOrder && minOrder.value !== rubVal) {
      const minText = `от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
      const titleLow = combined.toLowerCase();
      if (
        titleLow.includes("не пользовался") ||
        titleLow.includes("не заказывал") ||
        titleLow.includes("более года") ||
        titleLow.includes("больше года")
      ) {
        cleaned = `при заказе ${minText} • для тех, кто не заказывал больше года`;
      } else if (titleLow.includes("обедомани")) {
        cleaned = `на первый заказ ${minText} • в разделе «Обедомания» (12:00–16:00)`;
      } else {
        const isFirst = isFirstOrder || /перв|1[-‑–—]?[ыое]?й/i.test(title) || /перв|1[-‑–—]?[ыое]?й/i.test(terms);
        cleaned = isFirst
          ? `на первый заказ ${minText}`
          : `при заказе ${minText}`;
      }
    } else if (!cleaned || cleaned === "!" || cleaned.length < 3) {
      cleaned = isFirstOrder ? "на первый заказ" : "на заказ по акции";
    }

    return {
      type: "rub",
      discount: `−${formattedRub}`,
      condition: formatConditionPrefix(cleaned),
      fullTerms: terms || `Скидка ${formattedRub} активируется при оформлении заказа в ${storeName}.`,
      isNoCode,
    };
  }

  // 6. Бонусы / баллы
  const bonusMatch = title.match(/(\d+[\s\d]*)\s*(бонусов|баллов)/i) || terms.match(/(\d+[\s\d]*)\s*(бонусов|баллов)/i);
  if (bonusMatch) {
    const val = parseInt(bonusMatch[1].replace(/\s/g, ""), 10);
    return {
      type: "default",
      discount: `+${val} бонусов`,
      condition: minOrder ? `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽` : "на оплату заказов",
      fullTerms: terms || `Начисление ${val} бонусов при оформлении заказа в ${storeName}.`,
      isNoCode,
    };
  }

  // 7. Дефолтный переход по ссылке без кода
  if (isNoCode) {
    const formattedTitle = title || "Условия предложения";
    return {
      type: "default",
      discount: formattedTitle,
      condition: minOrder ? `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽` : /при\s+покупке\s+(?:от\s+)?\d+\s+пач/iu.test(terms) ? cleanTruncate(terms, 95) : "Условия акции смотрите у магазина",
      fullTerms: terms || "Перейдите на страницу предложения и уточните условия акции у магазина.",
      isNoCode: true,
    };
  }

  const formattedTitle = title || "Условия предложения";
  return {
    type: "default",
    discount: formattedTitle,
    condition: minOrder ? `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽` : isFirstOrder ? "на первый заказ" : "по промокоду",
    fullTerms: terms || `Промокод ${code} действует в интернет-магазине ${storeName}.`,
    isNoCode: false,
  };
}

function cleanTruncate(text: string, maxLen: number): string {
  if (!text || text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const spaceIdx = cut.lastIndexOf(" ");
  return (spaceIdx > 12 ? cut.slice(0, spaceIdx) : cut).trim() + "…";
}

/**
 * Очистка сырого текста условий от мусора и опечаток
 */
function cleanConditionText(raw: string, matchedPart?: string): string {
  if (!raw) return "";
  let text = raw;
  if (matchedPart) {
    const escaped = matchedPart.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`(?:скидка\\s+)?(?:до\\s+)?[-−]?\\s*${escaped}[.,:;!?]?`, "gi"), "");
  }
  return text
    // Превращаем машинные обозначения «1 заказ», «1-й заказ», «1ый заказ» в человеческие «первый заказ»
    .replace(/(^|[\s,.:;!?-])1(?:-?(?:ый|ой|ий|й))?\s+(заказ[а-яё]*|покупк[а-яё]*)/gi, "$1первый $2")
    .replace(/(^|[\s,.:;!?-])2(?:-?(?:ый|ой|ий|й))?\s+(заказ[а-яё]*|покупк[а-яё]*)/gi, "$1повторный $2")
    .replace(/(^|[\s,.:;!?-])3(?:-?(?:ый|ой|ий|й))?\s+(заказ[а-яё]*|покупк[а-яё]*)/gi, "$1третий $2")
    // Исправление опечатки «на се ...» / «се ...» -> «на все ...» / «все ...» (кириллически безопасно)
    .replace(/(^|[\s,.:;!?-])на\s+се(?=[\s,.:;!?-]|$)/gi, "$1на все")
    .replace(/(^|[\s,.:;!?-])се(?=[\s,.:;!?-]|$)/gi, "$1все")
    // Длинные формы раньше коротких: иначе из «на 1000 руб» вырезалось
    // «на 1000 р» и оставалось «уб на первый заказ».
    .replace(/^(?:на|в|от|при)\s+\d+[\s\d]*(?:%|₽|рублей|рубля|руб\.?|р\.?)(?![а-яё])/gi, "")
    .replace(
      /от\s+чека\s+(\d[\d\s]*)\s*(?:₽|рублей|рубля|руб\.?|р\.?)(?![а-яё])/gi,
      (_m, n: string) => `при заказе от ${Number(n.replace(/\s/g, "")).toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`,
    )
    .replace(/\(\s*доп\.?\s*промо\s*\)/gi, "")
    .replace(/^(?:на\s+)?спеццен[аы](?![а-яё])/i, "на товары по спеццене")
    // Убираем остаточные знаки препинания, точки и тире в начале строки
    .replace(/^[.,:;!?\s\-–—/|•·*]+/g, "")
    .replace(/^(?:скидка|минус|до)(?:[\s,.:;!?-]|$)/gi, "")
    .replace(/\(\s*\)/g, "") // удаление пустых скобок ()
    .replace(/не суммируется с другими акциями.*$/i, "")
    .replace(/скидка\s+\d+\s*(rub|руб|₽)/gi, "")
    .replace(/discount\s+sitewide/gi, "на весь ассортимент")
    .replace(/для всех пользователей при.*$/i, "")
    .replace(/[.,:;!?\s–—-]+$/g, "")
    .trim();
}

/**
 * Добавление корректного предлога с защитой от дублирования («на . на», «на на»)
 */
function formatConditionPrefix(str: string): string {
  let trimmed = str
    .replace(/^[.,:;!?\s\-–—/|•·*]+/g, "")
    .replace(/[.,:;!?\s\-–—/|•·*]+$/g, "")
    .trim();

  if (!trimmed) return "Уточните условия у магазина";
  if (/(?:при\s+заказе|заказ|покупк[а-яё]*|от\s+чека)\s+от\s*$/i.test(trimmed)) return "Уточните минимальную сумму заказа";
  if (/^(?:приобретайте|покупайте|получите|оформите|закажите|скидки|акции|акция|распродажа|специальные условия|повышенный кэшбэк|повышенный кешбэк)(?:\s|$)/i.test(trimmed)) return trimmed;

  // Убираем случайные дублированные предлоги и разделители вроде «на . на», «на на», «при на»
  trimmed = trimmed
    .replace(/^(на|при|в|для|от)\s+[.,:;!?\s\-–—/|•·*]*\s*(на|при|в|для|от|по|за|до)(?=[\s,.:;!?-]|$)/gi, "$2")
    .replace(/^(на|при|в|для|от)\s+[.,:;!?\s\-–—/|•·*]+\s*/gi, "$1 ")
    .trim();

  // Проверяем, начинается ли строка с полноценного предлога как отдельного слова
  if (/^(?:на|в|во|при|для|от|по|за|до|с|со|к|ко|без|свыше|\+)(?:[\s,.:;!?-]|$)/i.test(trimmed)) {
    return trimmed;
  }
  return `на ${trimmed}`;
}
