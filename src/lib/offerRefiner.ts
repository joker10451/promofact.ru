import { extractMinimumOrder } from "@/lib/admitadNormalizer";

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
  const pctMatch = title.match(/(\d+)\s*%/) || terms.match(/(\d+)\s*%/);
  const isGiftInText =
    /подарок|ролл|фото|пицца|подвеск|gift|в\s+подарок/i.test(title) ||
    /подарок|ролл|фото|пицца|подвеск|в\s+подарок/i.test(terms);

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
      discount: `−${val}%`,
      condition: condition.startsWith("+") || condition.startsWith("на") || condition.startsWith("при") ? condition : `+ ${condition}`,
      fullTerms: terms || `Скидка ${val}% и подарок при оформлении заказа.`,
      isNoCode,
    };
  }

  // 3. Подарки к заказу (Gift) — срабатывает если нет процентной скидки
  if (isGiftInText) {
    let giftTitle = "🎁 Подарок к заказу";

    if (/фреш\s*ролл/i.test(title) || /ролл\s+с\s+креветкой/i.test(title) || /ролл\s+с\s+креветкой/i.test(terms)) {
      giftTitle = "🎁 Ролл с креветкой и авокадо в подарок";
    } else if (/ролл/i.test(title) || /ролл/i.test(terms)) {
      giftTitle = "🎁 Ролл в подарок";
    } else if (/50\s*фото/i.test(title) || /50\s*фото/i.test(terms)) {
      giftTitle = "🎁 50 фото в подарок";
    } else if (/фото/i.test(title) || /фото/i.test(terms)) {
      giftTitle = "🎁 50 фото в подарок";
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
    if (!cleaned || cleaned.length < 3) {
      cleaned = cleanConditionText(terms, pctMatch[1]);
    }

    if (minOrder) {
      cleaned = `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
    } else if (!cleaned || cleaned === "!" || cleaned.length < 3) {
      cleaned = isFirstOrder ? "на первый заказ" : "на весь ассортимент";
    }

    return {
      discount: `−${val}%`,
      condition: formatConditionPrefix(cleaned),
      fullTerms: terms || `Скидка ${val}% применяется в корзине при оформлении заказа.`,
      isNoCode,
    };
  }

  // 5. Фиксированные скидки в рублях
  const rubMatch =
    title.match(/(?:скидка|минус)\s*(\d+[\s\d]*)\s*(?:₽|р\b|руб)/i) ||
    title.match(/(\d+[\s\d]*)\s*(?:₽|р\b|руб)/i) ||
    terms.match(/(?:скидка|минус)\s*(\d+[\s\d]*)\s*(?:₽|р\b|руб)/i) ||
    terms.match(/(\d+[\s\d]*)\s*(?:₽|р\b|руб)/i);

  if (rubMatch) {
    const rubVal = parseInt(rubMatch[1].replace(/\s/g, ""), 10);
    const formattedRub = rubVal.toLocaleString("ru-RU").replace(/\s/g, " ") + " ₽";
    let cleaned = cleanConditionText(title, rubMatch[0]);
    if (!cleaned || cleaned.length < 3) {
      cleaned = cleanConditionText(terms, rubMatch[0]);
    }

    if (minOrder && minOrder.value !== rubVal) {
      cleaned = `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽`;
    } else if (!cleaned || cleaned === "!" || cleaned.length < 3) {
      cleaned = isFirstOrder ? "на первый заказ" : "на заказ по акции";
    }

    return {
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
      discount: `+${val} бонусов`,
      condition: minOrder ? `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽` : "на оплату заказов",
      fullTerms: terms || `Начисление ${val} бонусов при оформлении заказа в ${storeName}.`,
      isNoCode,
    };
  }

  // 7. Дефолтный переход по ссылке без кода
  if (isNoCode) {
    return {
      discount: title.length > 28 ? title.slice(0, 28) + "…" : title || "Скидка",
      condition: minOrder ? `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽` : "акция действует по ссылке без ввода кода",
      fullTerms: terms || "Перейдите в магазин по кнопке, скидка применится автоматически в корзине.",
      isNoCode: true,
    };
  }

  return {
    discount: title.length > 24 ? title.slice(0, 24) + "…" : title || "Скидка",
    condition: minOrder ? `при заказе от ${minOrder.value.toLocaleString("ru-RU").replace(/\s/g, " ")} ₽` : isFirstOrder ? "на первый заказ" : "по промокоду",
    fullTerms: terms || `Промокод ${code} действует в интернет-магазине ${storeName}.`,
    isNoCode: false,
  };
}

/**
 * Очистка сырого текста условий от мусора и опечаток
 */
function cleanConditionText(raw: string, matchedPart?: string): string {
  if (!raw) return "";
  let text = raw;
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
    .replace(/на се\b/gi, "на все") // исправление опечатки «на се антивирусы»
    .replace(/для всех пользователей при.*$/i, "")
    .replace(/[,\s–—-]+$/g, "")
    .trim();
}

/**
 * Добавление корректного предлога
 */
function formatConditionPrefix(str: string): string {
  const trimmed = str.trim();
  if (!trimmed) return "на заказ";
  if (/^(на|в|при|для|от|свыше|\+)/i.test(trimmed)) {
    return trimmed;
  }
  return `на ${trimmed}`;
}
