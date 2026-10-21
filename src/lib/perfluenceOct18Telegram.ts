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

/** Approved ONLY for Telegram @smart_zakupka (not promofact.ru). */
export const GOLDAPPLE_OCT21_TELEGRAM_LINK = "https://gldppl.prfl.me/smart_zakupka/lr8e4c?erid=2Ranyo8yEMy";
export const GOLDAPPLE_OCT21_TELEGRAM_ERID = "2Ranyo8yEMy";
export const GOLDAPPLE_OCT21_TELEGRAM_LEGAL = 'Реклама. ООО "ЕКАТЕРИНБУРГ ЯБЛОКО", адрес: г. Екатеринбург, ул. Сакко и Ванцетти, 62, ОГРН 1126670019585 erid: 2Ranyo8yEMy';

const goldAppleCampaigns = [
  {
    id: 81707001, code: "ПРАЗДНИК",
    title: "Промокод ПРАЗДНИК в интернет-магазине Золотое Яблоко",
    terms: "Новый промокод на скидку в интернет-магазине и приложении «Золотое Яблоко». Срок действия с 21 по 29 октября 2026 года.",
    expires: "2026-10-29T23:59:59+03:00", isFirstOrderOnly: false, isUniversal: true,
  },
  {
    id: 81707002, code: "PERF",
    title: "Промокод PERF на скидку в Золотом Яблоке",
    terms: "Промокод PERF на покупки в мобильном приложении и интернет-магазине «Золотое Яблоко». Действует до 31 октября 2026 года, 23:59 по Москве.",
    expires: "2026-10-31T23:59:59+03:00", isFirstOrderOnly: false, isUniversal: true,
  },
] as const;

export function getGoldAppleTelegramOffers(now = Date.now()): Coupon[] {
  return goldAppleCampaigns.filter(p => now <= Date.parse(p.expires)).map((p): Coupon => ({
    id: p.id,
    promocode: {
      id: p.id,
      code: p.code,
      bonusName: p.title,
      terms: p.terms,
      expires: p.expires.slice(0, 10),
      isHit: p.code === "ПРАЗДНИК",
      isUniversal: p.isUniversal,
      isFirstOrderOnly: p.isFirstOrderOnly,
      customerTypeLabel: "Для всех покупателей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 1707, name: "Золотое Яблоко", slug: "zolotoe-yabloko", logo: "https://favicon.yandex.net/favicon/v2/goldapple.ru?size=120",
      category: "Косметика и парфюмерия", categorySlug: "kosmetika-i-parfyumeriya",
      about: "Интернет-магазин и супермаркет косметики и парфюмерии Золотое Яблоко.",
      conditions: "По условиям отдельного Telegram-размещения.",
      site: "https://goldapple.ru", activeBloggers: 0,
    },
    affiliate: {
      link: GOLDAPPLE_OCT21_TELEGRAM_LINK,
      landingLink: GOLDAPPLE_OCT21_TELEGRAM_LINK,
      ordMarker: GOLDAPPLE_OCT21_TELEGRAM_ERID,
      ordText: GOLDAPPLE_OCT21_TELEGRAM_LEGAL,
    },
    extraLinks: [],
  }));
}
