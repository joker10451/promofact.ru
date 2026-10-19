import type { Coupon } from "@/lib/types";
import { STABLE_STORES } from "@/lib/stableStores";

export const FOODBAND_OCTOBER_EXPIRES = "2026-10-31";
export const FOODBAND_ANNUAL_EXPIRES = "2026-12-31";

const foodbandStore: Coupon["store"] = {
  id: 18780,
  slug: "foodband",
  name: "Foodband",
  logo: "https://favicon.yandex.net/favicon/v2/foodband.ru?size=120",
  category: "Доставка из ресторанов",
  categorySlug: "dostavka-iz-restoranov",
  about: "Foodband — круглосуточная доставка пиццы, суши, вок и закусок в Москве и Московской области. Свежие продукты, большие порции и регулярные выгодные акции на сеты и подарки к заказу.",
  conditions: "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
  site: "https://foodband.ru",
  activeBloggers: 1200,
};

function makeAffiliate(link: string, erid: string): Coupon["affiliate"] {
  return {
    link,
    landingLink: link,
    ordMarker: erid,
    ordText: `Реклама. ООО «Фудбэнд». erid: ${erid}`,
  };
}

export const FOODBAND_OFFERS: Coupon[] = [
  // 1. Килограмм роллов за 1 290 ₽ (Сет №1, Сет №2, Сет №3)
  {
    id: 1878001,
    promocode: {
      id: 1878001,
      code: "admikgpromofact",
      bonusName: "Килограмм роллов за 1 290 ₽ (скидка более 50%)",
      terms: "Сет №1 из 6 роллов (1 кг) за 1 290 ₽ вместо 3 121 ₽ (Калифорния, Сливочный лосось, Миядзаки, Терияки Гриль, Филадельфия с угрём, Грин Ролл). Сет №2 за 1 590 ₽ вместо 3 377 ₽. Сет №3 за 1 890 ₽ вместо 3 887 ₽. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/k30b5f1plwc7dde8999c2e77510c9d/?erid=2bL9aMPo2e49hMef4rrTyideuE",
      "2bL9aMPo2e49hMef4rrTyideuE"
    ),
    extraLinks: [],
  },

  // 2. 4 ролла за 1 490 ₽ вместо 2 589 ₽
  {
    id: 1878002,
    promocode: {
      id: 1878002,
      code: "admirollpromofact",
      bonusName: "Сет из 4 роллов за 1 490 ₽ вместо 2 589 ₽",
      terms: "4 ролла за 1 490 ₽ вместо 2 589 ₽ (Филадельфия с угрем, Калифорния Лосось, Филадельфия с креветкой, Сливочный лосось). Также доступны: 5 роллов за 1 790 ₽ вместо 3 254 ₽ и 6 роллов за 1 990 ₽ вместо 4 009 ₽. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/td1xwuqcd7c7dde8999c2e77510c9d/?erid=2bL9aMPo2e49hMef4rrTyideyV",
      "2bL9aMPo2e49hMef4rrTyideyV"
    ),
    extraLinks: [],
  },

  // 3. 3 горячих ролла за 990 ₽ вместо 1 459 ₽
  {
    id: 1878003,
    promocode: {
      id: 1878003,
      code: "admi_rollpromofact",
      bonusName: "3 горячих ролла за 990 ₽ вместо 1 459 ₽",
      terms: "3 горячих ролла за 990 ₽ вместо 1 459 ₽ (Запеченный ролл со снежным крабом, Запеченный ролл с куриной грудкой, Хот спайси снежный краб). Также 5 роллов за 1 590 ₽ вместо 2 537 ₽ и 6 роллов за 1 990 ₽ вместо 3 086 ₽. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Для всех",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/7zz40m255uc7dde8999c2e77510c9d/?erid=2bL9aMPo2e49hMef4rrTyideyW",
      "2bL9aMPo2e49hMef4rrTyideyW"
    ),
    extraLinks: [],
  },

  // 4. Ролл Филадельфия в подарок при заказе от 1 590 ₽
  {
    id: 1878004,
    promocode: {
      id: 1878004,
      code: "admitad_filapromofact",
      bonusName: "Ролл Филадельфия в подарок от 1 590 ₽",
      terms: "Филадельфия Лайт в подарок при заказе от 1 590 ₽, Филадельфия с лососем в подарок от 2 290 ₽ по промокоду. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "От 1 590 ₽",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/f9ezen8jbtc7dde8999c2e77510c9d/?erid=2bL9aMPo2e49hMef4rrTyideyX",
      "2bL9aMPo2e49hMef4rrTyideyX"
    ),
    extraLinks: [],
  },

  // 5. Скидка до 35% от суммы заказа
  {
    id: 1878005,
    promocode: {
      id: 1878005,
      code: "admi35promofact",
      bonusName: "Скидка до 35% в зависимости от суммы заказа",
      terms: "Прогрессивная скидка от суммы заказа: 5% от 745 ₽, 7% от 1 290 ₽, 10% от 1 590 ₽, 15% от 1 990 ₽, 20% от 2 590 ₽, 25% от 4 500 ₽, 30% от 10 000 ₽, 35% от 15 000 ₽. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "От 745 ₽",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/z5wxfri8fdc7dde8999c2e77510c9d/?erid=2bL9aMPo2e49hMef4rrTyideyY",
      "2bL9aMPo2e49hMef4rrTyideyY"
    ),
    extraLinks: [],
  },

  // 6. Пицца Пепперони 23 см в подарок от 1 590 ₽
  {
    id: 1878006,
    promocode: {
      id: 1878006,
      code: "admi_pep_promofact",
      bonusName: "Пицца Пепперони 23 см в подарок от 1 590 ₽",
      terms: "Пицца Пепперони 23 см в подарок при заказе от 1 590 ₽ по промокоду. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "От 1 590 ₽",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/10pligopf9c7dde8999c2e77510c9d/?erid=MvGzQC98w3Z1gMq1nSqMP42V",
      "MvGzQC98w3Z1gMq1nSqMP42V"
    ),
    extraLinks: [],
  },

  // 7. Корпоративная скидка от 5% до 35% от 745 ₽
  {
    id: 1878007,
    promocode: {
      id: 1878007,
      code: "admitadanisa",
      bonusName: "Корпоративная скидка до 35% от 745 ₽",
      terms: "Корпоративная скидка от 5% до 35% на корпоративные и большие заказы от 745 ₽. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "Корпоративная",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/ssf67zb56pc7dde8999c2e77510c9d/?erid=2bL9aMPo2e49hMef4piUxh6rQu",
      "2bL9aMPo2e49hMef4piUxh6rQu"
    ),
    extraLinks: [],
  },

  // 8. Ролл Филадельфия в подарок от 1 790 ₽
  {
    id: 1878008,
    promocode: {
      id: 1878008,
      code: "admi_fila_promofact",
      bonusName: "Ролл Филадельфия в подарок от 1 790 ₽",
      terms: "Ролл Филадельфия в подарок при заказе от 1 790 ₽ по промокоду. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "От 1 790 ₽",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/fyz6u4paikc7dde8999c2e77510c9d/?erid=MvGzQC98w3Z1gMq1nSqMP46t",
      "MvGzQC98w3Z1gMq1nSqMP46t"
    ),
    extraLinks: [],
  },

  // 9. Подарок на выбор в День Рождения от 650 ₽
  {
    id: 1878009,
    promocode: {
      id: 1878009,
      code: "YOURDAY",
      bonusName: "Подарок на выбор в День Рождения от 650 ₽",
      terms: "На день рождения одно из 7 блюд на выбор в подарок при заказе от 650 ₽: пицца 30 см (Вегетарианская, Пепперони, Ассорти острая, Аппетитная Курочка, Классика) или роллы (Миядзаки, Шинпачи). Действует 7 дней до, в день рождения и 7 дней после него. До 31 декабря 2026 г.",
      expires: FOODBAND_ANNUAL_EXPIRES,
      isHit: true,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "В день рождения",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/kznsobuwp5c7dde8999c2e77510c9d/?erid=MvGzQC98w3Z1gMq1nwwgyq7m",
      "MvGzQC98w3Z1gMq1nwwgyq7m"
    ),
    extraLinks: [],
  },

  // 10. Пицца Маргарита 30 см в подарок от 1 190 ₽
  {
    id: 1878010,
    promocode: {
      id: 1878010,
      code: "admi_margo_promofact",
      bonusName: "Пицца Маргарита 30 см в подарок от 1 190 ₽",
      terms: "Пицца Маргарита 30 см в подарок при заказе от 1 190 ₽ по промокоду. До 31 октября 2026 г.",
      expires: FOODBAND_OCTOBER_EXPIRES,
      isHit: false,
      isUniversal: true,
      isFirstOrderOnly: false,
      customerTypeLabel: "От 1 190 ₽",
      region: "RU",
      isBarcode: false,
      barcodeImage: null,
      group: "admitad",
    },
    store: foodbandStore,
    affiliate: makeAffiliate(
      "https://kdbov.com/coupon/yo8jxd7dkfc7dde8999c2e77510c9d/?erid=MvGzQC98w3Z1gMq1nSqMP42Y",
      "MvGzQC98w3Z1gMq1nSqMP42Y"
    ),
    extraLinks: [],
  },
];
