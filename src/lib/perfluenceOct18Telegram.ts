import type { Coupon } from "@/lib/types";

/** Approved ONLY for Telegram @smart_zakupka (not promofact.ru). */
export const FLOR2U_OCT18_TELEGRAM_LINK = "https://flor2u.prfl.me/smart_zakupka/c4kk2w?erid=2RanynYVgRh";
export const FLOR2U_OCT18_TELEGRAM_ERID = "2RanynYVgRh";
export const FLOR2U_OCT18_TELEGRAM_LEGAL = "Реклама. ООО «ПРАЙМФЛОРА», ИНН 9724208955. erid: 2RanynYVgRh";

const campaigns = [
  {
    id: 829200351, code: "JHD_H13J3H1",
    title: "Скидка 35% на первый заказ в приложении Flor2u",
    terms: "Только на первый заказ через приложение Flor2u. Другие ограничения и результат применения уточняйте перед оплатой.",
    expires: "2026-10-18T23:59:59+03:00", isFirstOrderOnly: true, isUniversal: false,
  },
  {
    id: 829200252, code: "KRL_4G44HH5",
    title: "Скидка 25% в приложении Flor2u",
    terms: "В сохранённых условиях Perfluence указано: при заказе от 1 500 ₽ в приложении, для первого и повторных заказов. Уточняйте условия при оформлении.",
    expires: "2026-10-31T23:59:59+03:00", isFirstOrderOnly: false, isUniversal: true,
  },
] as const;

export function getFlor2uTelegramOffers(now = Date.now()): Coupon[] {
  return campaigns.filter(p=>now <= Date.parse(p.expires)).map((p): Coupon=>({
    id: p.id,
    promocode: {
      id: p.id,
      code: p.code,
      bonusName: p.title,
      terms: p.terms,
      expires: p.expires.slice(0, 10),
      isHit: p.code === "JHD_H13J3H1",
      isUniversal: p.isUniversal,
      isFirstOrderOnly: p.isFirstOrderOnly,
      customerTypeLabel: p.isFirstOrderOnly ? "Только первый заказ" : "Первый и повторные заказы",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 920, name: "Flor2u", slug: "flor2u", logo: null,
      category: "Цветы и подарки", categorySlug: "tsvety",
      about: "Доставка цветов Flor2u.", conditions: "По условиям отдельного Telegram-размещения.",
      site: "https://flor2u.ru", activeBloggers: 0,
    },
    affiliate: {
      link: FLOR2U_OCT18_TELEGRAM_LINK, landingLink: FLOR2U_OCT18_TELEGRAM_LINK,
      ordMarker: FLOR2U_OCT18_TELEGRAM_ERID, ordText: FLOR2U_OCT18_TELEGRAM_LEGAL,
    },
    extraLinks: [],
  }));
}
