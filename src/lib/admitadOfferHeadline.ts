/**
 * Recover a meaningful, source-backed benefit from published Admitad columns.
 *
 * Many published rows put ONLY the minimum-order condition into bonus_name,
 * while discount still contains the actual -25% / -1 000 ₽ / free delivery.
 * Displaying the condition as the headline hides the value of the promo.
 *
 * Never infer a percentage from a minimum-order amount or unlabelled "99%":
 * percentage of the assortment is not necessarily a consumer discount.
 */
const CONDITION_ONLY = /^(?:при\s+(?:заказе|покупке|оформлении)|(?:заказ|покупка)\s+от|на\s+заказ\s+от|от\s+[\d\s]+(?:₽|руб)|на\s+перв(?:ую|ой)\s+(?:покупк[ау]|оплат[уы])|для\s+новых\s+клиентов|(?:на\s+)?по\s+(?:купону|промокоду))(?=$|[\s,.:;!?])/iu;
const HAS_BENEFIT = /(?:[−-]\s*\d{1,3}\s*%|скидк[а-яё]*\s*(?:до\s*)?\d{1,3}\s*%|[−-]\s*[\d\s]+\s*₽|бесплатн[а-яё]*\s+достав|подар|к[еэ]шб[еэ]к|бонус|дополнительн[а-яё]*\s+урок|добавля[а-яё]*\s+\d+\s+урок)/iu;

export function isConditionOnlyOfferTitle(value: string): boolean {
  const title = (value || "").trim();
  return Boolean(title) && !HAS_BENEFIT.test(title) &&
    (CONDITION_ONLY.test(title) || /^скидка\s*$/iu.test(title));
}

function benefitFromTerms(terms: string): string | null {
  if (/к[еэ]шб[еэ]к/iu.test(terms)) {
    const cashback = terms.match(/к[еэ]шб[еэ]к[а-яё]*\s*(?:до\s*)?(\d{1,3})\s*%/iu);
    if (cashback && Number(cashback[1]) > 0 && Number(cashback[1]) <= 100)
      return "Кешбэк " + cashback[1] + "%";
    return "Кешбэк по условиям акции";
  }
  if (/бесплатн[а-яё]*\s+достав/iu.test(terms)) return "Бесплатная доставка";
  const explicitPct = terms.match(/скидк[а-яё]*\s*(?:до\s*)?[−-]?\s*(\d{1,3})\s*%/iu);
  if (explicitPct && Number(explicitPct[1]) > 0 && Number(explicitPct[1]) <= 100)
    return "−" + explicitPct[1] + "%";
  const explicitRub = terms.match(/скидк[а-яё]*\s*(?:до\s*)?[−-]?\s*([\d\s]+)\s*(?:₽|руб(?:лей|ля|\.?)?)/iu);
  if (explicitRub) {
    const amount = Number(explicitRub[1].replace(/\s/g, ""));
    if (amount > 0 && amount <= 100000) return "−" + amount.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽";
  }
  if (/подар|дарим|вручени[ея]\s+подар/iu.test(terms))
    return /на\s+выбор/iu.test(terms) ? "Подарок на выбор" : "Подарок к заказу";
  return null;
}

function benefitFromDiscount(discount: string): string | null {
  const value = (discount || "").trim();
  const pct = value.match(/^[−–-]\s*(\d{1,3})\s*%$/u);
  if (pct && Number(pct[1]) > 0 && Number(pct[1]) <= 100) return "−" + pct[1] + "%";
  const rub = value.match(/^[−–-]\s*([\d\s\u00a0]+)\s*₽$/u);
  if (rub) {
    const amount = Number(rub[1].replace(/\s/g, ""));
    if (amount > 0 && amount <= 100000) return "−" + amount.toLocaleString("ru-RU").replace(/\u00a0/g, " ") + " ₽";
  }
  // Recover non-cash benefits that the verified source stores in discount.
  const extraLessons = value.match(/^(?:добавля[а-яё]*|дарим|получите|плюс|\+)\s+(\d{1,2})\s+(?:дополнительн[а-яё]*\s+)?урок[а-яё]*/iu);
  if (extraLessons) {
    const count = Number(extraLessons[1]);
    if (count >= 1 && count <= 50) {
      const lesson = count % 10 === 1 && count % 100 !== 11
        ? "дополнительный урок"
        : count % 10 >= 2 && count % 10 <= 4 && !(count % 100 >= 12 && count % 100 <= 14)
        ? "дополнительных урока" : "дополнительных уроков";
      return String(count) + " " + lesson;
    }
  }
  if (/^.{0,3}бесплатн[а-яё]*\s+достав/iu.test(value)) return "Бесплатная доставка";
  return null;
}

export function resolveAdmitadOfferHeadline(
  bonusName: string | null | undefined,
  discount: string | null | undefined,
  terms: string | null | undefined,
): string {
  const title = (bonusName || "").trim();
  const details = (terms || "").trim();


  // Source-backed offer semantics: a service price is not a discount, cashback
  // is not an immediate price reduction and next-month pro discounts need proof.
  if (/^Aravia:\s*3D-диагностик/iu.test(details) && /от\s*2\s*000\s*руб/iu.test(details))
    return "3D-диагностика и массаж лица — от 2 000 ₽";
  if (/учебных\s+центрах\s+Aravia/iu.test(details) &&
      /диагностик/iu.test(details) && /бесплатн[а-яё]*\s+диагностик/iu.test(discount || ""))
    return "Бесплатная диагностика кожи";
  if (/повышенн[а-яё]*\s+к[еэ]шб[еэ]к\s*[-–—:]?\s*30\s*%/iu.test(details) &&
      /уход\s+за\s+волосами/iu.test(details))
    return "Кешбэк 30% на уход за волосами";
  if (/двойн[а-яё]*\s+к[еэ]шб[еэ]к/iu.test(details) && /уход\s+за\s+волосами/iu.test(details))
    return "Двойной кешбэк на товары, кроме ухода за волосами";
  if (/скидку\s+40\s*%\s+на\s+заказ\s+в\s+следующем\s+календарном\s+месяце/iu.test(details) &&
      /документ[а-яё]*\s+специалиста/iu.test(details))
    return "−40% на заказ следующего месяца для мастеров";
  if (/на\s+номинал\s+подарочн[а-яё]*\s+сертификат/iu.test(title) &&
      /^[−–-]\s*10\s*%$/u.test((discount || "").trim()))
    return "−10% на подарочные сертификаты";
  if (/подарок\s*[-–—]\s*арт\./iu.test(details) && /пептид/iu.test(details) &&
      /бесплатн[а-яё]*\s+доставк/iu.test(details))
    return "Подарок к заказу · при заказе от 1 500 ₽";
  if (/за\s+заказ\s+от\s+3\s*500\s*₽/iu.test(details) &&
      /подарки\s+суммируются/iu.test(details))
    return "Подарки при заказе от 3 500 ₽";

  // The original feed can describe six PACKS while the stored headline
  // incorrectly claims "6 ₽". Prefer the actual condition, not fake savings.
  const packs = details.match(/при\s+покупке\s+(?:от\s+)?(\d{1,2})\s+пач(?:ек|ки|к[ауи])\s+(кофе|чая)/iu);
  if (packs && !benefitFromDiscount(discount || "") && !benefitFromTerms(details))
    return "Акция при покупке " + packs[1] + " пачек " + packs[2];

  if (/^в(?:в)?вод\s+промокода\s+не\s+требуется/iu.test(details))
    return /из\s+категории\s+чай(?=\s|$)/iu.test(details)
      ? "Акция на чай без промокода"
      : "Акция на отдельные категории без промокода";

  // A loyalty balance is earned towards future orders, never an immediate -15%.
  if (/накопительн[а-яё]*\s+скидк/iu.test(details) &&
      /каждые\s+[\d\s]+\s+рубл/iu.test(details)) {
    const max = details.match(/максимальн[а-яё]*\s+скидк[а-яё]*\s*[—−-]?\s*(\d{1,2})\s*%/iu);
    return max ? "Накопительная программа — до " + max[1] + "%" : "Накопительная программа скидок";
  }

  if (title && !isConditionOnlyOfferTitle(title)) return title;

  const structured = benefitFromDiscount(discount || "");
  const described = benefitFromTerms(details);

  // When the feed classifies a gift as "free shipping" but the terms mention
  // only a gift, do not silently replace the gift with another benefit.
  const conflictingDelivery = structured === "Бесплатная доставка" &&
    described?.startsWith("Подарок") && !/достав/iu.test(details);
  const conflictingCashback = described?.startsWith("Кешбэк") && structured?.startsWith("−");
  const benefit = (conflictingDelivery || conflictingCashback) ? described : structured || described;
  const condition = /^скидка\s*$/iu.test(title) || /^(?:на\s+)?по\s+(?:купону|промокоду)(?=$|\s)/iu.test(title) ? "" : title;
  if (!benefit) return condition ? "Выгода не уточнена · " + condition : (title || "Условия предложения");
  if (!condition || benefit.toLowerCase() === condition.toLowerCase()) return benefit;
  return benefit + " · " + condition.charAt(0).toLowerCase() + condition.slice(1);
}

/** Prominent home-page cards should have a verifiable benefit, not just a basket threshold. */
export function hasBenefitHeadline(title: string | null | undefined): boolean {
  const value = (title || "").trim();
  return Boolean(value) && !isConditionOnlyOfferTitle(value) && HAS_BENEFIT.test(value);
}
