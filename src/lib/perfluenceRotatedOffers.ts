import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

/** Approved Magnit promo codes and refreshed PromoFact website URL from 29 October 2026. */
export const MAGNIT_OCT29_LINK = "https://mgntgm.prfl.me/sites/b2dnbt?erid=2Ranykq7AeF";
export const MAGNIT_OCT29_ERID = "2Ranykq7AeF";
// Site-specific WinLab publisher link renewed 16 October 2026; ERID has NOT been supplied.
// These staged offers remain excluded from production until the token is verified.
export const WINLAB_LINK_PENDING_ERID = "https://winelab.prfl.me/sites/gittf8";
const M_KOSMETIK_LINK = "https://mgntksm1.prfl.me/sites/1sq4qx?erid=2Ranymz3211";
const CITYDRIVE_FIRST_LINK = "https://citydrive.prfl.me/sites/tnp7jq?erid=2Ranykexfns";
const CITYDRIVE_APP_LINK = "https://citydrive.prfl.me/sites/pqng58?erid=2RanykbzhEB";
const YANDEX_TRAVEL_LINK = "https://travelyandex.prfl.me/sites/k9msuz?erid=2RanykJ47QF";
// Separately renewed promofact.ru publisher placement, supplied 15 October 2026.
const YANDEX_TRAVEL_NEW_LINK = "https://yandextravel.prfl.me/sites/t21yi1?erid=2RanynSc5X1";
const magnit: Coupon["store"] = { ...STABLE_STORES["magnit-dostavka"], activeBloggers: STABLE_STORES["magnit-dostavka"].activeBloggers ?? 0 };
const mKosmetik: Coupon["store"] = { ...STABLE_STORES["m-kosmetik"], activeBloggers: STABLE_STORES["m-kosmetik"].activeBloggers ?? 0 };
const winlab: Coupon["store"] = { ...STABLE_STORES["winlab"], activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0 };
const citydrive: Coupon["store"] = { ...STABLE_STORES.citydrive, activeBloggers: STABLE_STORES.citydrive.activeBloggers ?? 0 };
const yandexTravel: Coupon["store"] = { ...STABLE_STORES["yandeks-puteshestviya"], activeBloggers: STABLE_STORES["yandeks-puteshestviya"].activeBloggers ?? 0 };
const tanuki: Coupon["store"] = { ...STABLE_STORES["tanukifamily"], activeBloggers: STABLE_STORES["tanukifamily"].activeBloggers ?? 0 };
const perekrestok: Coupon["store"] = { ...STABLE_STORES["perekrestok-dostavka"], activeBloggers: STABLE_STORES["perekrestok-dostavka"].activeBloggers ?? 0 };
const magnitAd: Coupon["affiliate"] = {
  link: MAGNIT_OCT29_LINK,
  landingLink: MAGNIT_OCT29_LINK,
  ordMarker: MAGNIT_OCT29_ERID,
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2Ranykq7AeF',
};
const mKosmetikAd: Coupon["affiliate"] = {
  link: M_KOSMETIK_LINK,
  landingLink: M_KOSMETIK_LINK,
  ordMarker: "2Ranymz3211",
  ordText: 'Реклама. АО "Тандер", ИНН 2310031475. erid: 2Ranymz3211',
};
const citydriveLegal = "Реклама. Рекламодатель: ООО «НТС», Москва, вн. тер. г. м. о. Филевский парк, пр-д Береговой, д. 5А, к. 1, помещ. 1/13. ИНН 7704314221, ОГРН 1157746368999, citydrive.ru — «Ситидрайв» сервис аренды автомобилей. 0+";
const citydriveFirstAd: Coupon["affiliate"] = {
  link: CITYDRIVE_FIRST_LINK,
  landingLink: CITYDRIVE_FIRST_LINK,
  ordMarker: "2Ranykexfns",
  ordText: `${citydriveLegal} erid: 2Ranykexfns`,
};
const citydriveAppAd: Coupon["affiliate"] = {
  link: CITYDRIVE_APP_LINK,
  landingLink: CITYDRIVE_APP_LINK,
  ordMarker: "2RanykbzhEB",
  ordText: `${citydriveLegal} erid: 2RanykbzhEB`,
};
const yandexTravelAd: Coupon["affiliate"] = {
  link: YANDEX_TRAVEL_LINK,
  landingLink: YANDEX_TRAVEL_LINK,
  ordMarker: "2RanykJ47QF",
  ordText: 'Реклама. ООО "ЯНДЕКС.ВЕРТИКАЛИ", ИНН 7704340327. erid: 2RanykJ47QF',
};
const yandexTravelNewAd: Coupon["affiliate"] = {
  link: YANDEX_TRAVEL_NEW_LINK,
  landingLink: YANDEX_TRAVEL_NEW_LINK,
  ordMarker: "2RanynSc5X1",
  ordText: 'Реклама. ООО "ЯНДЕКС.ВЕРТИКАЛИ", ИНН 7704340327. erid: 2RanynSc5X1',
};
// Current Perfluence placement for PromoFact website, supplied 16 October 2026.
// All four Tanuki coupons must use this newly issued site URL AND matching ERID.
export const TANUKI_OCT16_LINK = "https://tanuki.prfl.me/sites/wyy3z6?erid=2RanymqYc6X";
export const TANUKI_OCT16_ERID = "2RanymqYc6X";
const tanukiAd: Coupon["affiliate"] = {
  link: TANUKI_OCT16_LINK,
  landingLink: TANUKI_OCT16_LINK,
  ordMarker: TANUKI_OCT16_ERID,
  ordText: 'Реклама. ООО "Корсика", ИНН 7730290633. erid: 2RanymqYc6X',
};
const TANUKI_SUPPORTED_CITIES = "Москва, Краснодар, Самара, Казань, Уфа, Воронеж, Екатеринбург и Нижний Новгород";

// Updated, account-approved Perfluence website placement for promofact.ru,
// supplied 19 October 2026. The cached widget has a DIFFERENT URL/ERID.
export const PEREKRESTOK_OCT16_LINK = "https://perekrestok.prfl.me/sites/me2ds4?erid=2RanykFbMxo";
export const PEREKRESTOK_OCT16_ERID = "2RanykFbMxo";
const perekrestokAd: Coupon["affiliate"] = {
  link: PEREKRESTOK_OCT16_LINK,
  landingLink: PEREKRESTOK_OCT16_LINK,
  ordMarker: PEREKRESTOK_OCT16_ERID,
  ordText: 'Реклама. ООО "ИКС 5 ДИДЖИТАЛ", ИНН 9722010808 erid: 2RanykFbMxo',
};

const winlabAd = {
  link: WINLAB_LINK_PENDING_ERID,
  landingLink: WINLAB_LINK_PENDING_ERID,
  ordMarker: "",
  ordText: "Реклама. АО «ВИНЛАБ», ИНН 7727404495. 18+. ERID обновлённой ссылки пока не предоставлен, публикация заблокирована.",
};

function offer(
  id: number, store: Coupon["store"], affiliate: Coupon["affiliate"],
  code: string, bonusName: string, expires: string,
  customerTypeLabel: string,
  terms = "Срок, ассортимент и применимость уточняйте при оформлении в приложении или на сайте рекламодателя.",
  firstOrderOnly = false,
): Coupon {
  return {
    id,
    promocode: {
      id, code, bonusName,
      terms,
      expires, isHit: false, isUniversal: false, isFirstOrderOnly: firstOrderOnly,
      customerTypeLabel, region: "RU", isBarcode: false, barcodeImage: null,
      group: "perfluence",
    },
    store, affiliate, extraLinks: [],
  };
}

/** Perfluence publisher dashboard for promofact.ru, 29 October 2026.
 * The 21 Oct placement gdpiqn has been superseded by b2dnbt.
 * The precise eligibility and thresholds were confirmed from Perfluence on 29 Oct.
 * All three must use this site-approved URL/ERID.
 */
export const MAGNIT_ROTATED_OFFERS: Coupon[] = [
  offer(82580141, magnit, magnitAd, "25GFC1TL4",
    "Скидка 31% на первый заказ от 2 000 ₽ в разделе «Гипермаркет» для нового пользователя", "2026-10-31T23:59:59+03:00", "Первый заказ, новым пользователям",
    "Промокод 25GFC1TL4: скидка 31% на первый заказ от 2 000 ₽ в разделе «Гипермаркет» приложения «Магнит» только для нового пользователя. Действует до 31 октября 2026 года, 23:59 МСК. Проверяйте итоговую сумму до оплаты.", true),
  offer(82580142, magnit, magnitAd, "SGPFB7JJGY",
    "Скидка 26% на один любой заказ от 2 000 ₽ в «Гипермаркете» при самовывозе", "2026-10-31T23:59:59+03:00", "Один заказ, самовывоз",
    "Промокод SGPFB7JJGY: скидка 26% на один любой заказ от 2 000 ₽ в разделе «Гипермаркет» приложения «Магнит» при самовывозе. Действует до 31 октября 2026 года, 23:59 МСК. Проверяйте итоговую сумму до оплаты."),
  offer(82580143, magnit, magnitAd, "Дождь",
    "Скидка 31% на каждый заказ от 1 700 ₽ в «Экспрессе» или от 2 500 ₽ в «Гипермаркете»", "2026-11-03T23:59:59+03:00", "Общий промокод, каждый заказ",
    "Промокод «Дождь»: скидка 31% на каждый заказ от 1 700 ₽ в разделе «Экспресс» или от 2 500 ₽ в разделе «Гипермаркет» приложения «Магнит». Общий промокод из подборки «Магнит». Действует до 3 ноября 2026 года, 23:59 МСК. Проверяйте итоговую сумму до оплаты."),
];

/**
 * Perfluence publisher dashboard for promofact.ru, 14 October 2026:
 * three current M.Kosmetik vouchers with a refreshed tracking URL and ERID.
 * This newer project-specific evidence supersedes the October 11 pause notice.
 * Do not imply these codes work for every user or on every product.
 */
export const M_KOSMETIK_ROTATED_OFFERS: Coupon[] = [
  offer(82548041, mKosmetik, mKosmetikAd, "Чай", "Скидка 41% по промокоду «Чай» в М.Косметик", "2026-10-22", "По условиям предложения"),
  offer(82548042, mKosmetik, mKosmetikAd, "PK4GMWJUK", "Скидка 36% по промокоду PK4GMWJUK в М.Косметик", "2026-10-31", "По условиям предложения"),
  offer(82548043, mKosmetik, mKosmetikAd, "PF21K0T5LF", "Скидка 21% по промокоду PF21K0T5LF в М.Косметик", "2026-10-31", "По условиям предложения"),
];

/**
 * Two distinct publisher-approved Citydrive placements, Perfluence account
 * for promofact.ru (October 2026). Do not swap their ERIDs or tracking URLs.
 * PERFCITY107 is the approved FIRST RIDE + OZON certificate placement.
 * The other 3 belong to the separate "Citydrive app" placement.
 * Exact limitations for SAVE1480 / 1500DRIVE202 / BACK163 were not supplied.
 */
export const CITYDRIVE_APPROVED_OFFERS: Coupon[] = [
  offer(81483071, citydrive, citydriveFirstAd, "PERFCITY107",
    "Первая поездка в Ситидрайв с сертификатом OZON", "2026-10-31",
    "Только первая поездка",
    "Оформите первую поездку в Ситидрайв по условиям согласованной акции, чтобы получить сертификат OZON. Размер сертификата, допустимые тарифы и порядок выдачи уточняйте у рекламодателя. Промокод действует до 31 октября 2026 года.",
    true),
  offer(81483072, citydrive, citydriveAppAd, "SAVE1480",
    "Скидка 50% в приложении Ситидрайв", "2026-10-31",
    "По условиям акции",
    "Промокод SAVE1480: заявлена скидка 50%. Тарифы, максимальную скидку и применимость проверяйте в приложении Ситидрайв перед поездкой. Действует до 31 октября 2026 года."),
  offer(81483073, citydrive, citydriveAppAd, "1500DRIVE202",
    "Скидка 1 500 ₽ в приложении Ситидрайв", "2026-10-31",
    "По условиям акции",
    "Промокод 1500DRIVE202: заявлена скидка 1 500 ₽. Неизвестны минимальная стоимость, подходящие поездки и иные ограничения — уточняйте условия в приложении. Действует до 31 октября 2026 года."),
  offer(81483074, citydrive, citydriveAppAd, "BACK163",
    "Промокод BACK163 для Ситидрайв", "2026-10-31",
    "По условиям акции",
    "Промокод BACK163 указан в согласованном размещении Ситидрайв. Размер бонуса не предоставлен. Проверьте доступный бонус и ограничения в приложении до поездки. Действует до 31 октября 2026 года."),
];

/**
 * The user-provided Tanuki website placement was renewed on 16 October.
 * The Perfluence snapshot still includes old tracking link/ERID for some codes.
 * The advertiser-provided ZB1177 bonus was confirmed by the publisher:
 * one "Запечённый краб" roll for an order from 1 490 ₽.
 * Tanuki may NOT be jointly included in editorial selections with FARFOR
 * or Ёёёёёёё (formerly Ёбидоёби).
 */
export const TANUKI_OCT16_OFFERS: Coupon[] = [
  offer(82602001, tanuki, tanukiAd, "20FU1416",
    "Скидка 20% на первый заказ от 1 090 ₽ в Тануки",
    "2026-10-29T23:59:59+03:00", "Первый заказ · 8 городов",
    `Скидка 20% на первый заказ в Тануки от 1 090 ₽. Города действия по опубликованному фиду: ${TANUKI_SUPPORTED_CITIES}. Проверьте применимость заказа, ограничения и итоговую цену до оплаты. До 29 октября 2026 года, 23:59 по Москве.`,
    true),
  offer(82602002, tanuki, tanukiAd, "15FU1416",
    "Скидка 15% на повторный заказ от 1 490 ₽ в Тануки",
    "2026-10-29T23:59:59+03:00", "Повторный заказ",
    "Скидка 15% на повторный заказ в Тануки при сумме от 1 490 ₽. Применимость, ограничения и итоговую сумму уточняйте при оформлении. До 29 октября 2026 года, 23:59 по Москве."),
  offer(82602003, tanuki, tanukiAd, "FU1417",
    "Ролл Фурай в подарок при заказе от 1 490 ₽",
    "2026-10-18T23:59:59+03:00", "Заказ от 1 490 ₽ · 8 городов",
    `Ролл Фурай в подарок по промокоду FU1417 при заказе от 1 490 ₽. Города действия по опубликованному фиду: ${TANUKI_SUPPORTED_CITIES}. Наличие подарка и другие ограничения проверяйте в корзине. До 18 октября 2026 года, 23:59 по Москве.`),
  offer(82602004, tanuki, tanukiAd, "ZB1177",
    "Ролл «Запечённый краб» в подарок при заказе от 1 490 ₽",
    "2026-11-01T23:59:59+03:00", "Заказ от 1 490 ₽",
    "По промокоду ZB1177 — ролл «Запечённый краб» в подарок при заказе в Тануки от 1 490 ₽. Наличие ролла, ассортимент и прочие ограничения проверьте в корзине перед оплатой. Действует до 1 ноября 2026 года, 23:59 по Москве."),
];

/**
 * Perfluence website publisher dashboard 16 October 2026: three active
 * Perekrestok Delivery codes, all on a renewed link/ERID. The legacy widget
 * conflicts on expiry of 173T5R64A and does not contain 171LREDEY. Keep only
 * the confirmed code + benefit + cutoff. Do not infer basket-wide eligibility,
 * minimum spend, maximum savings or first-order restrictions from the old feed.
 */
export const PEREKRESTOK_OCT16_OFFERS: Coupon[] = [
  offer(82604304, perekrestok, perekrestokAd, "178PQJL7A",
    "Скидка 750 ₽ по промокоду в Перекрёсток Доставка",
    "2026-10-31T23:59:59+03:00", "По условиям акции",
    "Промокод 178PQJL7A: скидка 750 ₽ в приложении «Перекрёсток Доставка». Действует до 31 октября 2026 года, 23:59 по Москве."),
  offer(82604301, perekrestok, perekrestokAd, "171LREDEY",
    "Скидка 30% по промокоду в Перекрёсток Доставка",
    "2026-10-31T23:59:59+03:00", "По условиям акции",
    "Промокод 171LREDEY: скидка 30% в Перекрёсток Доставка. Действует в мобильном приложении до 31 октября 2026 года, 23:59 по Москве."),
  offer(82604302, perekrestok, perekrestokAd, "172E2Y5TJ",
    "Скидка 300 ₽ от 1 200 ₽ в Перекрёсток Доставка",
    "2026-10-31T23:59:59+03:00", "Заказ от 1 200 ₽",
    "Промокод 172E2Y5TJ: скидка 300 ₽ при заказе от 1 200 ₽ в приложении «Перекрёсток Доставка». Действует до 31 октября 2026 года, 23:59 по Москве."),
  offer(82604303, perekrestok, perekrestokAd, "174NYBBJV",
    "Готовая еда за 1 ₽ при первом заказе от 1 000 ₽",
    "2026-10-31T23:59:59+03:00", "1-й заказ · от 1 000 ₽",
    "Промокод 174NYBBJV: товары из категории «Готовая еда» за 1 ₽ при первом заказе от 1 000 ₽ в приложении «Перекрёсток Доставка». Действует до 31 октября 2026 года, 23:59 по Москве.",
    true),
];

/**
 * Perfluence approved site placement for promofact.ru on 15 October 2026.
 * PF-ALLIOOO-EGGTH expires at precisely 10:59 Moscow time on 16 Oct:
 * never extend it to the end of that day.
 * The amount/eligibility of SHARJAH26 is not supplied by the publisher;
 * do not infer a 26% discount from its name.
 * The partner prohibits placing Yandex Travel in a selection alongside MTS Music.
 */
export const YANDEX_TRAVEL_ROTATED_OFFERS: Coupon[] = [
  offer(82511351, yandexTravel, yandexTravelAd, "PF-ALLIOOO-EGGTH",
    "Скидка 1 000 ₽ на бронирование в Яндекс Путешествиях",
    "2026-10-16T10:59:00+03:00",
    "Отели из подборки · по условиям предложения",
    "Промокод PF-ALLIOOO-EGGTH: скидка 1 000 ₽ при бронировании по условиям рекламодателя. Срок действия — до 16 октября 2026 года, 10:59 по Москве. Конкретные отели, возможный минимальный чек и другие ограничения проверьте до оплаты."),
  offer(82511352, yandexTravel, yandexTravelAd, "BOLSHE",
    "Скидка 5 000 ₽ на бронирование в Яндекс Путешествиях",
    "2026-10-31T23:59:59+03:00",
    "Отели из подборки · по условиям предложения",
    "Промокод BOLSHE: скидка 5 000 ₽ по условиям рекламодателя. Срок действия — до 31 октября 2026 года, 23:59 по Москве. Неизвестны минимальная сумма бронирования, подходящие отели и иные ограничения; проверьте их до оплаты."),
  offer(82511353, yandexTravel, yandexTravelAd, "SHARJAH26",
    "Промокод SHARJAH26 для бронирования через Яндекс Путешествия",
    "2026-10-31T23:59:59+03:00",
    "По условиям акции",
    "Промокод SHARJAH26 указан в согласованной публикации до 31 октября 2026 года, 23:59 по Москве. Размер скидки или бонуса в предоставленных данных не указан. Проверьте выгоду, направления и другие ограничения при бронировании."),
  // Renewed approved link for the 2,500 RUB voucher; the earlier three offers retain their distinct placement.
  offer(82511354, yandexTravel, yandexTravelNewAd, "PF-PREMIUMPRO-B66N2",
    "Скидка 2 500 ₽ на бронирование отеля из подборки",
    "2026-10-16T10:59:00+03:00",
    "Отели из подборки · по условиям предложения",
    "Промокод PF-PREMIUMPRO-B66N2: скидка 2 500 ₽ при бронировании отеля из подборки. Действует до 16 октября 2026 года, 10:59 по московскому времени. Подходящие отели, минимальную сумму и прочие ограничения уточняйте при бронировании."),
];

/**
 * WinLab promofact.ru placement, renewed 16 October 2026. Publisher approved.
 * The link is https://winelab.prfl.me/sites/gittf8, but the new campaign
 * erid / ORD marker has NOT been supplied. Never use the old placement's token.
 * Keep these codes in staging, excluded from getCustomCoupons and getCoupons.
 * The two October 21 offers expire at 10:59 Moscow, NOT 23:59.
 * WinLab is also prohibited from joint promotions with Ukids.
 */
export const WINLAB_ROTATED_OFFERS_PENDING_ERID: Coupon[] = [
  offer(81409141, winlab, winlabAd, "10PFNS5229", "Скидка 10% в ВинЛаб",
    "2026-10-31T23:59:59+03:00", "18+ · по условиям акции",
    "Промокод 10PFNS5229: скидка 10%. Условия участия, ассортимент и ограничения уточняйте у рекламодателя. Действует до 31 октября 2026 года, 23:59 по Москве."),
  offer(81409142, winlab, winlabAd, "WCPFOKT4737", "Скидка 10% в ВинЛаб",
    "2026-10-21T10:59:00+03:00", "18+ · по условиям акции",
    "Промокод WCPFOKT4737: скидка 10%. Условия и ограничения уточняйте у рекламодателя. Действует до 21 октября 2026 года, 10:59 по Москве."),
  offer(81409143, winlab, winlabAd, "5OKTPF4737", "Скидка 5% в ВинЛаб",
    "2026-10-21T10:59:00+03:00", "18+ · по условиям акции",
    "Промокод 5OKTPF4737: скидка 5%. Условия и ограничения уточняйте у рекламодателя. Действует до 21 октября 2026 года, 10:59 по Москве."),
];
// Approved Gold Apple website placement, 21 October 2026.
export const GOLDAPPLE_OCT21_LINK = "https://gldppl.prfl.me/smart_zakupka/lr8e4c?erid=2Ranyo8yEMy";
export const GOLDAPPLE_OCT21_ERID = "2Ranyo8yEMy";
export const GOLDAPPLE_OCT21_LEGAL = 'Реклама. ООО "ЕКАТЕРИНБУРГ ЯБЛОКО", адрес: г. Екатеринбург, ул. Сакко и Ванцетти, 62, ОГРН 1126670019585 erid: 2Ranyo8yEMy';

const goldApple: Coupon["store"] = {
  ...STABLE_STORES["zolotoe-yabloko"],
  activeBloggers: STABLE_STORES["zolotoe-yabloko"].activeBloggers ?? 0,
};

const goldAppleAd: Coupon["affiliate"] = {
  link: GOLDAPPLE_OCT21_LINK,
  landingLink: GOLDAPPLE_OCT21_LINK,
  ordMarker: GOLDAPPLE_OCT21_ERID,
  ordText: GOLDAPPLE_OCT21_LEGAL,
};

export const GOLDAPPLE_ROTATED_OFFERS: Coupon[] = [
  offer(
    81707003,
    goldApple,
    goldAppleAd,
    "МИНУС",
    "Скидка 50% на категорию «наша коллекция» от 8 000 ₽",
    "2026-10-29T23:59:59+03:00",
    "Скидка 50% на первый и повторные заказы",
    "Скидка 50% от 8 000 ₽ на первый и все повторные заказы на категорию «наша коллекция» по промокоду МИНУС. Действует только для авторизованных пользователей в интернет-магазине и приложении Золотое Яблоко до 29 октября 2026 года до 23:59 по Москве. Не суммируется со скидками выше 40%, акциями 3=2, 2=1 и подарками при покупке; не действует на подарочные карты. Есть бренды-исключения.",
  ),
  offer(
    81707001,
    goldApple,
    goldAppleAd,
    "ПРАЗДНИК",
    "Скидка до 20% на подборку товаров к Хэллоуину",
    "2026-10-29T23:59:59+03:00",
    "Скидка до 20% на первый и повторные заказы",
    "Скидка до 10% от 6 000 ₽, до 15% от 9 000 ₽ и до 20% от 12 000 ₽ на первый и все повторные заказы на специальную подборку товаров. Действует только для авторизованных пользователей в интернет-магазине и приложении Золотое Яблоко до 29 октября 2026 года до 23:59 по Москве. Не суммируется со скидками выше 40%, акциями 3=2, 2=1 и подарками при покупке; не действует на подарочные карты. Есть бренды-исключения.",
  ),
  offer(
    81707002,
    goldApple,
    goldAppleAd,
    "PERF",
    "Скидка до 20% на первый заказ + 300 бонусов",
    "2026-10-31T23:59:59+03:00",
    "Скидка до 20% + 300 бонусов",
    "Скидка на первый заказ: до 10% от 3 000 ₽, до 15% от 6 000 ₽, до 20% от 9 000 ₽ + 300 бонусов на счет. Действует только для авторизованных пользователей в мобильном приложении и интернет-магазине Золотое Яблоко до 31 октября 2026 года до 23:59 по Москве. Не суммируется со скидками выше 40%, акциями 3=2, 2=1 и подарками при покупке; не действует на подарочные карты. Есть бренды-исключения.",
  ),
];
