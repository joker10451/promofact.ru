import { MAGNIT_ROTATED_OFFERS, M_KOSMETIK_ROTATED_OFFERS, CITYDRIVE_APPROVED_OFFERS, YANDEX_TRAVEL_ROTATED_OFFERS, TANUKI_OCT16_OFFERS, PEREKRESTOK_OCT16_OFFERS, GOLDAPPLE_ROTATED_OFFERS } from "@/lib/perfluenceRotatedOffers";
import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";
import { PERFLUENCE_OCT16_APPROVED_OFFERS } from "@/lib/perfluenceOct16Offers";
import { VKUSVILL_OCT18_SITE_OFFERS } from "@/lib/perfluenceOct18Scheduled";
import { PERFLUENCE_OCT18_BATCH_OFFERS } from "@/lib/perfluenceOct18Batch";
import { FOODBAND_OFFERS } from "@/lib/foodbandOffers";
import { isCouponActive } from "@/lib/couponExpiry";

/**
 * Ручные купоны от рекламодателей и партнёрских сетей.
 * Каждый — с партнёрской ссылкой и маркировкой (erid).
 *
 * Здесь остались только те, которых нет в выдаче Perfluence. Купоны Додо
 * Пиццы, Бетховена, Ситидрайва, Кинопоиска и СберПрайма убраны: теперь эти
 * акции приходят из виджета, где у них ссылка и erid публикации самого сайта.
 * Ручные копии перебивали их при дедупе и уводили заказы на публикацию
 * Telegram-канала — результаты засчитывались не тому аккаунту.
 */

// PERFLUENCE / SberDevices: temporary approved PromoFact site placement.
// Both codes were supplied from the approved project; do not invent restrictions.
// The official site is informational; all outward CTA links MUST use the updated
// project-specific Perfluence tracking URL with the same approved ERID.
const SBERDEVICES_LINK = "https://sberdevaysy1.prfl.me/sites/fq4aly?erid=2RanymNsVkw";
const SBERDEVICES_ERID = "2RanymNsVkw";
const SBERDEVICES_STORE: Coupon["store"] = {
  id: 5067,
  name: "СберДевайсы",
  slug: "sberdevaysy",
  logo: null,
  category: "Электроника и техника",
  categorySlug: "elektronika-i-tehnika",
  about: "SberDevices — официальный интернет-магазин телевизоров, умных колонок, медиаприставок и устройств для умного дома.",
  conditions: "Проверяйте ограничения конкретного промокода и итоговую цену в корзине магазина.",
  site: "https://sberdevices.ru/",
  activeBloggers: 0,
};
const SBERDEVICES_AFFILIATE: Coupon["affiliate"] = {
  link: SBERDEVICES_LINK,
  landingLink: SBERDEVICES_LINK,
  ordMarker: SBERDEVICES_ERID,
  ordText: "Реклама. Рекламодатель — ООО «САЛЮТДЕВАЙСЫ», ИНН: 7730253720. erid: 2RanymNsVkw",
};

const PODRUZHKA_STORE: Coupon["store"] = {
      id: 5040,
      name: "Подружка",
      slug: "podruzhka",
      logo: "/brands/podruzhka-mark.svg",
      category: "Косметика и парфюмерия",
      categorySlug: "kosmetika-i-parfyumeriya",
      about: "«Подружка» — сеть магазинов косметики, парфюмерии, средств по уходу за собой и аксессуаров. В каталоге представлены популярные бренды декоративной и уходовой косметики по выгодным ценам.",
      conditions: "Онлайн-подарок по промокоду до 15 октября 2026 года. Отдельная акция с подарком при предъявлении штрихкода в розничном магазине действует до 18 октября.",
      site: "https://www.podrygka.ru",
      activeBloggers: 3120,
    };

export const CUSTOM_COUPONS: Coupon[] = [
  // Updated Ivi Perfluence placement for promofact.ru, 15 October 2026.
  // Do not reuse the old FILM35 coupon or old tracking link.
  {
    id: 82430035,
    promocode: {
      id: 82430035,
      code: "begrnta7swiz",
      bonusName: "35 дней подписки Иви бесплатно по промокоду",
      terms: "Промокод begrnta7swiz активируется до 31 декабря 2026 года включительно только для новых пользователей на территории РФ по специальной ссылке. 35 дней бесплатного пробного доступа. Требуется привязка банковской карты; при проверке карты возможно временное удержание с последующим возвратом. После окончания пробного периода подписка автоматически продлевается на 30 дней с оплатой согласно условиям Иви. Сервис 18+. Условия: www.ivi.ru/info/agreement.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только новые пользователи в РФ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: { ...STABLE_STORES["ivi"], activeBloggers: STABLE_STORES["ivi"].activeBloggers ?? 0 },
    affiliate: {
      link: "https://ivi1.prfl.me/sites/xpmis8?erid=2RanynVXhiB",
      landingLink: "https://ivi1.prfl.me/sites/xpmis8?erid=2RanynVXhiB",
      ordMarker: "2RanynVXhiB",
      ordText: "Реклама. ivi.ru. erid: 2RanynVXhiB. Сервис 18+.",
    },
    extraLinks: [],
  },
  ...MAGNIT_ROTATED_OFFERS,
  ...M_KOSMETIK_ROTATED_OFFERS,
  ...CITYDRIVE_APPROVED_OFFERS,
  ...YANDEX_TRAVEL_ROTATED_OFFERS,
  ...TANUKI_OCT16_OFFERS,
  ...PEREKRESTOK_OCT16_OFFERS,
  ...GOLDAPPLE_ROTATED_OFFERS,
  ...PERFLUENCE_OCT16_APPROVED_OFFERS,
  ...VKUSVILL_OCT18_SITE_OFFERS,
  ...PERFLUENCE_OCT18_BATCH_OFFERS,
  ...FOODBAND_OFFERS,
  {
    id: 50671,
    promocode: {
      id: 50671,
      code: "Sberdv171",
      bonusName: "Скидка 6% по промокоду Sberdv171",
      terms: "Промокод Sberdv171: скидка 6% по условиям проекта «СберДевайсы». Сверьте применимость к выбранным товарам, возможные исключения и сочетание с другими акциями в корзине официального магазина. До 31 октября 2026 года, 23:59 по Москве.",
      expires: "2026-10-31",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Условия уточняйте в магазине",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: SBERDEVICES_STORE,
    affiliate: SBERDEVICES_AFFILIATE,
    extraLinks: [],
  },
  {
    id: 50672,
    promocode: {
      id: 50672,
      code: "Sberdv71",
      bonusName: "Скидка 5% по промокоду Sberdv71",
      terms: "Промокод Sberdv71: скидка 5% по условиям проекта «СберДевайсы». Сверьте применимость к выбранным товарам, возможные исключения и сочетание с другими акциями в корзине официального магазина. До 31 октября 2026 года, 23:59 по Москве.",
      expires: "2026-10-31",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Условия уточняйте в магазине",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: SBERDEVICES_STORE,
    affiliate: SBERDEVICES_AFFILIATE,
    extraLinks: [],
  },

  {
    id: 50029,
    promocode: {
      id: 50029,
      code: "", // Скидка по ссылке
      bonusName: "СберПрайм на 60 дней за 2 ₽ + 185 бонусов Спасибо в подарок",
      terms: "Подписка СберПрайм на 60 дней всего за 2 рубля и 185 бонусов Спасибо в приветствие! Повышенный кешбэк до 37% бонусами Спасибо за покупки в «Ашан», «Gloria Jeans», «Вкусно и точка». Действует для новых пользователей или клиентов без активной подписки более 150 дней при оплате картой Сбербанка.",
      expires: "2026-11-30T23:59:59+03:00",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Новые пользователи или >150 дней без подписки",
      region: "RU",
      isBarcode: false,
      barcodeImage: "/images/sberprime.png",
      group: "perfluence",
    },
    store: {
      id: 5030,
      name: "СберПрайм",
      slug: "sberprime",
      logo: "https://favicon.yandex.net/favicon/v2/sberbank.ru?size=120",
      category: "Сервисы и подписки",
      categorySlug: "servisy-i-podpiski",
      about: "СберПрайм — единая подписка на сервисы: фильмы в Okko, музыка в Звуке, бесплатная доставка продуктов и повышенный кэшбэк бонусами Спасибо на покупки.",
      conditions: "Промокод не требуется. Перейдите по официальной ссылке и подключите подписку на 60 дней за 2 ₽.",
      site: "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF",
      activeBloggers: 15400,
    },
    affiliate: {
      link: "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF",
      landingLink: "https://sberbank1.prfl.me/sites/96qfi8?erid=2RanynswGSF",
      ordMarker: "2RanynswGSF",
      ordText: "Реклама. Рекламодатель — АО «ЦПЛ» (ОГРН: 1117746689840, г. Москва). erid: 2RanynswGSF",
    },
    extraLinks: [],
  },
  {
    id: 50030,
    promocode: {
      id: 50030,
      code: "", // Скидка по ссылке
      bonusName: "СберПрайм 60 дней за 1 ₽ + 5% кэшбэк на игры в GamersHub",
      terms: "Получайте 5% бонусами Спасибо с каждой покупки игр, ключей и пополнения кошелька на GamersHub без комиссий. Для новичков действует пробный период СберПрайм 60 дней за 1 ₽ или годовая подписка за 333 ₽/мес.",
      expires: "2026-12-31",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: "/images/sberprime.png",
      group: "perfluence",
    },
    store: {
      id: 5030,
      name: "СберПрайм",
      slug: "sberprime",
      logo: "https://favicon.yandex.net/favicon/v2/sberbank.ru?size=120",
      category: "Сервисы и подписки",
      categorySlug: "servisy-i-podpiski",
      about: "СберПрайм — единая подписка на сервисы: фильмы в Okko, музыка в Звуке, бесплатная доставка и повышенный кэшбэк бонусами Спасибо на покупки и игры на GamersHub.",
      conditions: "Промокод не требуется. Перейдите по ссылке и оформите подписку. Открывать через российские браузеры.",
      site: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      activeBloggers: 15400,
    },
    affiliate: {
      link: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      landingLink: "https://sberbank1.prfl.me/sites/ynqvsf?erid=2RanymUAmpP",
      ordMarker: "2RanymUAmpP",
      ordText: "Реклама. Рекламодатель — АО «ЦПЛ» (ОГРН: 1117746689840, г. Москва). erid: 2RanymUAmpP",
    },
    extraLinks: [],
  },
  {
    id: 50041,
    promocode: {
      id: 50041,
      code: "2921098554627",
      bonusName: "Набор косметики в подарок при покупке от 1 500 ₽ онлайн",
      terms: "Подарочный набор косметики при онлайн-заказе от 1 500 ₽. Промокод 2921098554627 действует только онлайн до 15 октября 2026 года, 23:59 по Москве. Наличие подарка и ограничения уточняйте при оформлении.",
      expires: "2026-10-15",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Только онлайн",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: PODRUZHKA_STORE,
    affiliate: {
      link: "https://podrygka.prfl.me/sites/q8ufig?erid=2RanymdB9PR",
      landingLink: "https://podrygka.prfl.me/sites/q8ufig?erid=2RanymdB9PR",
      ordMarker: "2RanymdB9PR",
      ordText: "Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2RanymdB9PR",
    },
    extraLinks: [],
  },
  {
    id: 50042,
    promocode: {
      id: 50042,
      code: "2921098553491",
      bonusName: "Подарок по штрихкоду на кассе при покупке от 1 500 ₽",
      terms: "До 18 октября 2026 года, 23:59 по Москве. Подарочный набор косметики при покупке от 1 500 ₽ в розничном магазине «Подружка» по штрихкоду 2921098553491. Покажите штрихкод кассиру до оплаты. Онлайн-промокод 2921098554627 действует отдельно и не заменяет штрихкод для кассы. Наличие подарка и другие ограничения уточняйте в магазине.",
      expires: "2026-10-18",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Только в магазинах",
      region: "RU",
      isBarcode: true,
      barcodeImage: null,
      group: "perfluence",
    },
    store: PODRUZHKA_STORE,
    affiliate: {
      link: "https://podrygka.prfl.me/sites/xza4uw?erid=2Ranymef8fm",
      landingLink: "https://podrygka.prfl.me/sites/xza4uw?erid=2Ranymef8fm",
      ordMarker: "2Ranymef8fm",
      ordText: "Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2Ranymef8fm",
    },
    extraLinks: [],
  },
  {
    id: 50045,
    promocode: {
      id: 50045,
      code: "2921060875255",
      bonusName: "Скидка 30% без минимальной суммы заказа",
      terms: "Скидка 30% без минимальной суммы заказа. Действует онлайн и в розничных магазинах «Подружка» по штрихкоду до 25 октября 2026 года.",
      expires: "2026-10-25",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: true,
      barcodeImage: null,
      group: "perfluence",
    },
    store: PODRUZHKA_STORE,
    affiliate: {
      link: "https://podrygka.prfl.me/sites/xigpgx?erid=2RanynYwD2T",
      landingLink: "https://podrygka.prfl.me/sites/xigpgx?erid=2RanynYwD2T",
      ordMarker: "2RanynYwD2T",
      ordText: "Реклама. ООО «Табер Трейд», ИНН 7709505477, ОГРН 1037739861851. Адрес места нахождения (Юридический адрес): 115280, г.Москва, ул.Ленинская Слобода, д.19, комн. 21В erid: 2RanynYwD2T",
    },
    extraLinks: [],
  },
  {
    id: 50050,
    promocode: {
      id: 50050,
      code: "KW9JUP1C",
      bonusName: "Скидка 25% на заказ",
      terms: "Скидка 25% по промокоду KW9JUP1C на постельное бельё, текстиль, декор и товары для дома Cozy Home при заказе онлайн до 18 октября 2026 года 23:59.",
      expires: "2026-10-18",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      id: 3641,
      name: "Cozy Home",
      slug: "cozy-home",
      logo: "https://favicon.yandex.net/favicon/v2/cozyhome.ru?size=120",
      category: "Всё для дома",
      categorySlug: "vse-dlya-doma",
      about: "Cozy Home — сеть магазинов стильного домашнего уюта: комплекты постельного белья, мягкие пледы, махровые полотенца, домашняя одежда и изысканные ароматы для дома.",
      conditions: "Введите промокод KW9JUP1C при оформлении заказа онлайн для получения скидки 25%. Действует до 18 октября 2026 года 23:59.",
      site: "https://cozyhome.ru",
      activeBloggers: 4200,
    },
    affiliate: {
      link: "https://cozyhome.prfl.me/sites/jy58f4?erid=2RanynxDUwD",
      landingLink: "https://cozyhome.prfl.me/sites/jy58f4?erid=2RanynxDUwD",
      ordMarker: "2RanynxDUwD",
      ordText: "Реклама. Cozy Home erid: 2RanynxDUwD",
    },
    extraLinks: [],
  },
  {
    id: 82641761,
    promocode: {
      id: 82641761,
      code: "PERF79WJXX5E",
      bonusName: "Скидка 12% на первый заказ в Poizon (ДЭВУ)",
      terms: "Скидка 12% (не более 4 000 ₽) на первый заказ на сайте и в мобильном приложении Poizon по промокоду PERF79WJXX5E. Суммируется со скидками, без минимальной суммы заказа. Действует до 31 октября 2026 года.",
      expires: "2026-10-31",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Только на первый заказ",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["poizon"],
      activeBloggers: STABLE_STORES["poizon"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://poizon.prfl.me/sites/08vmlg?erid=2Ranyo4fyN3",
      landingLink: "https://poizon.prfl.me/sites/08vmlg?erid=2Ranyo4fyN3",
      ordMarker: "2Ranyo4fyN3",
      ordText: "Реклама. Poizon erid: 2Ranyo4fyN3",
    },
    extraLinks: [],
  },
  {
    id: 82643831,
    promocode: {
      id: 82643831,
      code: "СПАСИБО",
      bonusName: "Розыгрыш 18,5 млн бонусов Спасибо за вклад в Сбере",
      terms: "Откройте любой вклад в Сбере по ссылке и станьте участником розыгрыша 18,5 млн бонусов Спасибо. Всего 1000 победителей! Ставка до 13,5% годовых на срок 3–7 месяцев.",
      expires: "2026-11-30",
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех клиентов",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["vklad-v-sbere"],
      activeBloggers: STABLE_STORES["vklad-v-sbere"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://sberbank1.prfl.me/sites/iqsdgq?erid=2RanykueVCo",
      landingLink: "https://sberbank1.prfl.me/sites/iqsdgq?erid=2RanykueVCo",
      ordMarker: "2RanykueVCo",
      ordText: "Реклама. Рекламодатель: ПАО Сбербанк. ИНН: 7707083893, Ген. лицензия ЦБ РФ № 1481 от 11.08.2015 г. erid: 2RanykueVCo",
    },
    extraLinks: [],
  },
  // Approved WinLab placement for promofact.ru, post 17313895
  {
    id: 81409001,
    promocode: {
      id: 81409001,
      code: "10PFNS5229",
      bonusName: "Скидка 10% на первый заказ в ВинЛаб",
      terms: "Скидка 10% на первый заказ на сайте и в мобильном приложении ВинЛаб. Максимальная скидка — 3 000 ₽. Суммируется со скидками, кроме раздела «Ваша цена». Срок действия по 31 октября 2026 года.",
      expires: "2026-10-31",
      isHit: true,
      isUniversal: false,
      isFirstOrderOnly: true,
      customerTypeLabel: "Новые покупатели",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["winlab"],
      activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://winelab.prfl.me/sites/gittf8",
      landingLink: "https://winelab.prfl.me/sites/gittf8",
      ordMarker: "",
      ordText: "Реклама. АО «ВИНЛАБ», ИНН 7727404495. 18+.",
    },
    extraLinks: [],
  },
  {
    id: 81409002,
    promocode: {
      id: 81409002,
      code: "WCPFOKT9920",
      bonusName: "Дополнительная скидка 10% на WinClub в ВинЛаб",
      terms: "Дополнительная скидка 10% на каждый заказ товаров со значком WinClub на сайте и в мобильном приложении ВинЛаб. Максимальная скидка — 3 000 ₽. Срок действия по 28 октября 2026 года.",
      expires: "2026-10-28",
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех покупателей",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["winlab"],
      activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://winelab.prfl.me/sites/gittf8",
      landingLink: "https://winelab.prfl.me/sites/gittf8",
      ordMarker: "",
      ordText: "Реклама. АО «ВИНЛАБ», ИНН 7727404495. 18+.",
    },
    extraLinks: [],
  },
  {
    id: 81409003,
    promocode: {
      id: 81409003,
      code: "5OKTPF9920",
      bonusName: "Скидка 5% на повторные заказы в ВинЛаб",
      terms: "Скидка 5% на каждый повторный заказ на сайте и в мобильном приложении ВинЛаб. Максимальная скидка — 3 000 ₽. Суммируется со скидками, кроме раздела «Ваша цена». Срок действия по 28 октября 2026 года.",
      expires: "2026-10-28",
      isHit: false,
      isUniversal: false,
      isFirstOrderOnly: false,
      customerTypeLabel: "Повторные заказы",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "perfluence",
    },
    store: {
      ...STABLE_STORES["winlab"],
      activeBloggers: STABLE_STORES["winlab"].activeBloggers ?? 0,
    },
    affiliate: {
      link: "https://winelab.prfl.me/sites/gittf8",
      landingLink: "https://winelab.prfl.me/sites/gittf8",
      ordMarker: "",
      ordText: "Реклама. АО «ВИНЛАБ», ИНН 7727404495. 18+.",
    },
    extraLinks: [],
  },
];

/**
 * Время публикации для купонов с согласованной датой выхода (по Москве).
 * До этого момента купон не попадает на сайт.
 */
const PUBLISH_FROM: Record<number, string> = {};

export function getCustomCoupons(now = Date.now()): Coupon[] {
  return CUSTOM_COUPONS.filter((c) => {
    const from = PUBLISH_FROM[c.id];
    if (from && now < new Date(from).getTime()) return false;
    return isCouponActive(c.promocode.expires, now);
  });
}
