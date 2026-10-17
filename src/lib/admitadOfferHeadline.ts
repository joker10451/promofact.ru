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
const CONDITION_ONLY = /^(?:при\s+(?:заказе|покупке|оформлении)|(?:заказ|покупка)\s+от|на\s+заказ\s+от|от\s+[\d\s]+(?:₽|руб)|на\s+перв(?:ую|ой)\s+(?:покупк[ау]|оплат[уы])|для\s+новых\s+клиентов|по\s+промокоду)(?=$|[\s,.:;!?])/iu;
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
  if (title && !isConditionOnlyOfferTitle(title)) return title;

  const structured = benefitFromDiscount(discount || "");
  const described = benefitFromTerms(details);

  // When the feed classifies a gift as "free shipping" but the terms mention
  // only a gift, do not silently replace the gift with another benefit.
  const conflictingDelivery = structured === "Бесплатная доставка" &&
    described?.startsWith("Подарок") && !/достав/iu.test(details);
  const conflictingCashback = described?.startsWith("Кешбэк") && structured?.startsWith("−");
  const benefit = (conflictingDelivery || conflictingCashback) ? described : structured || described;
  const condition = /^скидка\s*$/iu.test(title) ? "" : title;
  if (!benefit) return condition ? "Выгода не уточнена · " + condition : (title || "Условия предложения");
  if (!condition || benefit.toLowerCase() === condition.toLowerCase()) return benefit;
  return benefit + " · " + condition.charAt(0).toLowerCase() + condition.slice(1);
}

/** Prominent home-page cards should have a verifiable benefit, not just a basket threshold. */
export function hasBenefitHeadline(title: string | null | undefined): boolean {
  const value = (title || "").trim();
  return Boolean(value) && !isConditionOnlyOfferTitle(value) && HAS_BENEFIT.test(value);
}
