/**
 * Модуль семантической очистки и обогащения условий акций (Offer Refiner).
 * Превращает сырые обрывки и опечатки из CPA-фидов в понятный, красивый русский текст.
 */

export interface RefinedOffer {
  discount: string;
  condition: string;
  fullTerms: string;
  isNoCode: boolean;
}

export function refineOffer(
  rawTitle: string,
  rawTerms: string,
  code: string,
  storeName: string,
  isFirstOrder: boolean
): RefinedOffer {
  const title = (rawTitle || "").trim();
  const terms = (rawTerms || "").trim();
  const isNoCode = !code || code.trim() === "";

  // 1. Фиксированные спец-предложения
  if (isNoCode) {
    if (/60\s*дней|плюс/i.test(title)) {
      return {
        discount: "60 дней за 1 ₽",
        condition: "подписка Яндекс Плюс и Кинопоиск для новых пользователей",
        fullTerms: "60 дней бесплатного доступа к сервисам Яндекс Плюс, затем 299 ₽/мес. Отмена подписки в любой момент в личном кабинете.",
        isNoCode: true,
      };
    }
    return {
      discount: title.length > 28 ? title.slice(0, 28) + "…" : title || "Скидка",
      condition: "акция действует по ссылке без ввода кода",
      fullTerms: terms || "Перейдите в магазин по кнопке, скидка применится автоматически в корзине.",
      isNoCode: true,
    };
  }

  // 2. Подарки к заказу
  if (/подарок|ролл|фото|пицца|подвеск/i.test(title) || /подарок|ролл|фото/i.test(terms)) {
    let giftTitle = "🎁 Подарок к заказу";
    if (/ролл/i.test(title) || /ролл/i.test(terms)) giftTitle = "🎁 Ролл в подарок";
    else if (/фото/i.test(title)) giftTitle = "🎁 50 фото в подарок";
    else if (/подвеск/i.test(title)) giftTitle = "🎁 Подвеска в подарок";
    else if (/пицц/i.test(title)) giftTitle = "🎁 Пицца в подарок";

    const thresholdMatch = (title + " " + terms).match(/от\s+([\d\s]+)\s*₽/i);
    const condition = thresholdMatch
      ? `при заказе от ${thresholdMatch[1].trim()} ₽`
      : "по промокоду при оформлении заказа";

    return {
      discount: giftTitle,
      condition,
      fullTerms: terms || `Добавьте товары в корзину и введите промокод ${code} для получения подарка к заказу.`,
      isNoCode: false,
    };
  }

  // 3. Процентные скидки
  const pctMatch = title.match(/(\d+\s*%)/);
  if (pctMatch) {
    const pct = pctMatch[1].replace(/\s/g, "");
    let cleaned = cleanConditionText(title, pctMatch[1]);

    if (!cleaned || cleaned === "!" || cleaned.length < 3) {
      cleaned = isFirstOrder ? "на первый заказ" : "на весь ассортимент";
    }

    return {
      discount: `−${pct}`,
      condition: formatConditionPrefix(cleaned),
      fullTerms: terms || `Скидка ${pct} применяется в корзине при вводе промокода ${code}.`,
      isNoCode: false,
    };
  }

  // 4. Фиксированные скидки в рублях
  const rubMatch = title.match(/(\d+[\s\d]*\s*₽|\d+[\s\d]*\s*р\b|\d+[\s\d]*\s*руб)/i);
  if (rubMatch) {
    const rubNum = rubMatch[1].replace(/[^\d]/g, "").trim();
    let cleaned = cleanConditionText(title, rubMatch[1]);

    if (!cleaned || cleaned === "!" || cleaned.length < 3) {
      cleaned = isFirstOrder ? "на первый заказ" : "на заказ по акции";
    }

    return {
      discount: `−${rubNum} ₽`,
      condition: formatConditionPrefix(cleaned),
      fullTerms: terms || `Скидка ${rubNum} ₽ активируется при оформлении заказа с промокодом ${code}.`,
      isNoCode: false,
    };
  }

  // 5. Бонусы / баллы
  const bonusMatch = title.match(/(\d+[\s\d]*)\s*(бонусов|баллов)/i);
  if (bonusMatch) {
    return {
      discount: `+${bonusMatch[1].trim()} бонусов`,
      condition: "на оплату заказов",
      fullTerms: terms || `Начисление ${bonusMatch[1].trim()} бонусов при активации промокода ${code}.`,
      isNoCode: false,
    };
  }

  return {
    discount: title.length > 24 ? title.slice(0, 24) + "…" : title || "Скидка",
    condition: isFirstOrder ? "на первый заказ" : "по промокоду",
    fullTerms: terms || `Промокод ${code} действует в интернет-магазине ${storeName}.`,
    isNoCode: false,
  };
}

/**
 * Очистка сырого текста условий от мусора
 */
function cleanConditionText(raw: string, matchedPart: string): string {
  return raw
    .replace(new RegExp(`(скидка\\s+)?(до\\s+)?[-−]?\\s*${matchedPart}`, "gi"), "")
    .replace(/^(на|в|от|при)\s+\d+[\s\d]*(%|₽|р|руб)/gi, "")
    .replace(/^(скидка|минус|до|на|в|от|[,\s–—-])+/gi, "")
    .replace(/\(\s*\)/g, "") // удаление пустых скобок ()
    .replace(/не суммируется с другими акциями.*$/i, "")
    .replace(/скидка\s+\d+\s*(rub|руб|₽)/gi, "")
    .replace(/discount\s+sitewide/gi, "на весь ассортимент")
    .replace(/на се\b/gi, "на все") // исправление частой опечатки «на се антивирусы»
    .replace(/[,\s–—-]+$/g, "")
    .trim();
}

/**
 * Добавление корректного предлога
 */
function formatConditionPrefix(text: string): string {
  if (!text) return "на заказ";
  if (/^(на|при|от|в|для|\+)\s+/i.test(text)) {
    return text;
  }
  return `на ${text}`;
}
