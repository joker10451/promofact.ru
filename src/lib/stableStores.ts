/**
 * src/lib/stableStores.ts
 *
 * Стабильный реестр вечнозелёных магазинов (Evergreen Store Registry).
 *
 * НАЗНАЧЕНИЕ:
 * Гарантирует, что страницы магазинов (/store/[slug]), на которые ссылаются
 * опубликованные статьи базы знаний (/sovety) или рубрики сайта, никогда не
 * возвращают 404, даже если промокоды рекламодателя временно истекли в live-фиде Perfluence.
 *
 * ПРАВИЛА БЕЗОПАСНОСТИ:
 * 1. Содержит ТОЛЬКО статическую метаинформацию о бренде (id, slug, name, category, about, site, logo).
 * 2. СТРОГО ЗАПРЕЩЕНО хранить live-промокоды, даты экспирации, ссылки prfl.me, erid и размер скидок.
 * 3. Динамические купоны и офферы по-прежнему подтягиваются исключительно из Perfluence.
 * 4. Если активных купонов нет, страница магазина отображается в fallback-режиме (coupons: []).
 */

export interface StableStoreMeta {
  id: number;
  slug: string;
  name: string;
  logo: string | null;
  category: string;
  categorySlug: string;
  about: string | null;
  conditions: string | null;
  site: string;
  activeBloggers?: number;
}

export const STABLE_STORES: Record<string, StableStoreMeta> = {
  "avito-puteshestviya": {
    "id": 3161,
    "slug": "avito-puteshestviya",
    "name": "Авито Путешествия",
    "logo": "https://favicon.yandex.net/favicon/v2/www.avito.ru?size=120",
    "category": "Путешествия и туризм",
    "categorySlug": "puteshestviya-i-turizm",
    "about": "Авито Путешествия - сервис онлайн-бронирования с более 300 тысячами доступных объектов частного жилья по всей России, который помогает быстро и безопасно снимать посуточно квартиры, дома и апартаменты.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.avito.ru/moskva/travel",
    "activeBloggers": 3420
  },
  "carely": {
    "id": 4575,
    "slug": "carely",
    "name": "Carely",
    "logo": "https://favicon.yandex.net/favicon/v2/www.ozon.ru?size=120",
    "category": "Косметика и парфюмерия",
    "categorySlug": "kosmetika-i-parfyumeriya",
    "about": "ART&amp;FACT - российский бренд уходовой косметики для лица и тела. В линейке: сыворотки, кремы, тоники, средства для очищения и ухода с активными компонентами. Verifique - антивозрастная косметика с эффективными составами. Бренд предлагает сыворотки, кремы, тоники и средства для комплексного ухода за кожей. Structura - профессиональный уход за волосами и кожей головы. Представлены средства для очищения, восстановления, увлажнения и защиты волос на каждом этапе ухода.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.ozon.ru/seller/carelygroup/",
    "activeBloggers": 708
  },
  "citydrive": {
    "id": 1483,
    "slug": "citydrive",
    "name": "Ситидрайв",
    "logo": "https://favicon.yandex.net/favicon/v2/citydrive.ru?size=120",
    "category": "Сервисы и подписки",
    "categorySlug": "servisy-i-podpiski",
    "about": "Ситидрайв - каршеринг, который предлагает аренду автомобилей с различными тарифами - от поминутного до суточного. Большое количество машин в хорошем состоянии по всему городу, что делает передвижение по крупным мегаполисам максимально удобным, а, главное, быстрым. Представлен в нескольких городах страны - Москва, МО, Санкт-Петербург, Сочи, Екатеринбург, Нижний Новгород, Ростов-на-Дону, Краснодар.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://citydrive.ru/",
    "activeBloggers": 7105
  },
  "delimobil": {
    "id": 112,
    "slug": "delimobil",
    "name": "Делимобиль",
    "logo": "https://favicon.yandex.net/favicon/v2/delimobil.ru?size=120",
    "category": "Путешествия и туризм",
    "categorySlug": "puteshestviya-i-turizm",
    "about": "Делимобиль - крупнейший онлайн-сервис каршеринга в России, работает в 16 городах. В парке почти 30 тысяч авто: от привычных Polo и Solaris, веселых Smart и MINI, спортивного Stinger, и до презентабельных Audi, BMW, Mercedes.",
    "conditions": "Реклама. Делимобиль - сервис каршеринга. Промокод на 2000 бонусов на первую поездку для новых пользователей. Нужно активировать до 30.09.2026 г. Промокод на 200 бонусов для пользователей, не совершавших аренды более 60 дней. Нужно активировать до 30.09.2026 г. Не является публичной офертой. Скидки применяются согласно условиям на сайте",
    "site": "https://delimobil.ru",
    "activeBloggers": 4164
  },
  "detskie-platezhnye-aksessuary-ot-sbera": {
    "id": 4025,
    "slug": "detskie-platezhnye-aksessuary-ot-sbera",
    "name": "Детские платёжные аксессуары от Сбера",
    "logo": "https://favicon.yandex.net/favicon/v2/sberbank.ru?size=120",
    "category": "Сервисы и подписки",
    "categorySlug": "servisy-i-podpiski",
    "about": "«Детские платёжные аксессуары от Сбера» - платёжные стикеры и брелоки для детей и подростков, позволяющие удобно и безопасно оплачивать покупки картой Сбера.",
    "conditions": "Условия и тарифы обслуживания платёжных аксессуаров определяются ПАО Сбербанк.",
    "site": "https://www.sberbank.com/ru",
    "activeBloggers": 291
  },
  "dodo-pizza": {
    "id": 1653,
    "slug": "dodo-pizza",
    "name": "Додо Пицца",
    "logo": "https://favicon.yandex.net/favicon/v2/dodopizza.ru?size=120",
    "category": "Доставка из ресторанов",
    "categorySlug": "dostavka-iz-restoranov",
    "about": null,
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://dodopizza.ru/",
    "activeBloggers": 6143
  },
  "farfor": {
    "id": 2333,
    "slug": "farfor",
    "name": "FARFOR",
    "logo": "https://favicon.yandex.net/favicon/v2/msk.farfor.ru?size=120",
    "category": "Доставка из ресторанов",
    "categorySlug": "dostavka-iz-restoranov",
    "about": "FARFOR - сеть ресторанов доставки готовой еды. Здесь можно заказать всё и сразу в одном месте: от роллов и пиццы до поке и супов.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://msk.farfor.ru/",
    "activeBloggers": 4598
  },
  "fmart": {
    "id": 4579,
    "slug": "fmart",
    "name": "FMART",
    "logo": "https://favicon.yandex.net/favicon/v2/fmart-flowers.ru?size=120",
    "category": "Цветы и подарки",
    "categorySlug": "tsvety",
    "about": null,
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://fmart-flowers.ru",
    "activeBloggers": 766
  },
  "geltek": {
    "id": 4338,
    "slug": "geltek",
    "name": "Geltek",
    "logo": "https://favicon.yandex.net/favicon/v2/geltek.ru?size=120",
    "category": "Косметика и парфюмерия",
    "categorySlug": "kosmetika-i-parfyumeriya",
    "about": null,
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://geltek.ru/ai-skin/",
    "activeBloggers": 1832
  },
  "iv-roshe": {
    "id": 2993,
    "slug": "iv-roshe",
    "name": "Ив Роше",
    "logo": "https://favicon.yandex.net/favicon/v2/yves-rocher.ru?size=120",
    "category": "Косметика и парфюмерия",
    "categorySlug": "kosmetika-i-parfyumeriya",
    "about": "«Ив Роше» (Yves Rocher) - французская растительная косметика и парфюмерия на основе натуральных ингредиентов.",
    "conditions": "Промокоды на скидку и подарки вводятся в корзине официального интернет-магазина Ив Роше.",
    "site": "https://www.yves-rocher.ru",
    "activeBloggers": 65
  },
  "ivi": {
    "id": 2430,
    "slug": "ivi",
    "name": "Иви",
    "logo": "https://favicon.yandex.net/favicon/v2/www.ivi.ru?size=120",
    "category": "Онлайн-кинотеатры",
    "categorySlug": "onlayn-kinoteatry",
    "about": "Иви - один из крупнейших онлайн-кинотеатров в России с самым большим каталогом. Здесь 100 000+ фильмов, мультфильмов и сериалов. Много новинок и культовых проектов крупнейших зарубежных и российских студий.",
    "conditions": "Активация промокода доступна для пользователей, не имевших Подписку Иви, а также активаций сертификатов в предыдущие 90 дней. Для активации промокода требуются данные банковской карты. Услуги предоставляются в соответствии с Пользовательским соглашением Сервиса: www.ivi.ru/info/agreement. 18+",
    "site": "https://www.ivi.ru/",
    "activeBloggers": 5363
  },
  "kinopoisk": {
    "id": 2231,
    "slug": "kinopoisk",
    "name": "Кинопоиск",
    "logo": "https://favicon.yandex.net/favicon/v2/www.kinopoisk.ru?size=120",
    "category": "Онлайн-кинотеатры",
    "categorySlug": "onlayn-kinoteatry",
    "about": "Кинопоиск - онлайн-кинотеатр с доступом к тысячам фильмов, сериалов, мультфильмов и шоу. В сервисе представлены оригинальные проекты: \"Красная поляна\", \"Беспринципные в Питере\", \"Триггер\", \"Проект Анна Николаевна\", \"Мажор\".",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.kinopoisk.ru/",
    "activeBloggers": 5015
  },
  "letual": {
    "id": 266,
    "slug": "letual",
    "name": "ЛЭТУАЛЬ",
    "logo": "https://favicon.yandex.net/favicon/v2/www.letu.ru?size=120",
    "category": "Косметика и парфюмерия",
    "categorySlug": "kosmetika-i-parfyumeriya",
    "about": "ЛЭТУАЛЬ - лидер парфюмерно-косметической индустрии в России, насчитывает около 1000 розничных магазинов. Помимо парфюмерии и косметики там можно приобрети: технику Kitfort и SAKURA, одежду для дома и спорта, товары для уборки от SYNERGETIC, канцелярию от любимого детского бренда MORIKI DORIKI, и даже товары для взрослых для ярких свиданий.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.letu.ru/",
    "activeBloggers": 19177
  },
  "librederm": {
    "id": 3807,
    "slug": "librederm",
    "name": "Librederm",
    "logo": "https://favicon.yandex.net/favicon/v2/librederm.ru?size=120",
    "category": "Косметика и парфюмерия",
    "categorySlug": "kosmetika-i-parfyumeriya",
    "about": "Librederm - международный бренд косметических и дерматологических средств. Лидер в увлажнении кожи лица. №1 в очищении и антивозрастном уходе. Эффективность средств доказана клинически, а сами средства рекомендованы дерматологами и косметологами.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://librederm.ru",
    "activeBloggers": 2666
  },
  "litres": {
    "id": 100009,
    "slug": "litres",
    "name": "Литрес",
    "logo": "https://favicon.yandex.net/favicon/v2/litres.ru?size=120",
    "category": "Онлайн-образование",
    "categorySlug": "onlayn-obrazovanie",
    "about": "«Литрес» - крупнейший сервис электронных и аудиокниг в России и странах СНГ.",
    "conditions": "Промокоды активируются в личном кабинете или в корзине на сайте litres.ru.",
    "site": "https://litres.ru",
    "activeBloggers": 19
  },
  "m-kosmetik": {
    "id": 2548,
    "slug": "m-kosmetik",
    "name": "М.Косметик",
    "logo": "https://favicon.yandex.net/favicon/v2/promokod.magnit.ru?size=120",
    "category": "Косметика и парфюмерия",
    "categorySlug": "kosmetika-i-parfyumeriya",
    "about": "М.Косметик — одна из ведущих розничных сетей по продаже косметики, бытовой химии и товаров для дома в России.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://promokod.magnit.ru/",
    "activeBloggers": 8083
  },
  "magnit-dostavka": {
    "id": 2582,
    "slug": "magnit-dostavka",
    "name": "Магнит Доставка",
    "logo": "https://favicon.yandex.net/favicon/v2/dostavka.magnit.ru?size=120",
    "category": "Доставка продуктов",
    "categorySlug": "dostavka-produktov",
    "about": "Онлайн-сервис доставки, в котором можно заказать товары из магазина «Магнит», узнать об акциях и скидках, участвовать в играх и использовать купоны. В приложении есть ваша карта лояльности и информация о доступных бонусах. Можно выбрать до 10 «Любимых категорий» и получать до 40% кешбэка бонусами.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://dostavka.magnit.ru/",
    "activeBloggers": 8722
  },
  "megamarket": {
    "id": 3611,
    "slug": "megamarket",
    "name": "Мегамаркет",
    "logo": "https://favicon.yandex.net/favicon/v2/megamarket.ru?size=120",
    "category": "Маркетплейсы",
    "categorySlug": "marketpleysy",
    "about": "Мегамаркет - один из крупнейших в России маркетплейсов с миллионами товаров. Здесь можно купить все: от ручки до посудомойки. Можно заказать экспресс-доставку, есть доставка по клику. До 99% вы сможете оплатить бонусами Спасибо, а еще оформить покупку в рассрочку.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://megamarket.ru/",
    "activeBloggers": 3444
  },
  "ostrovok": {
    "id": 2271,
    "slug": "ostrovok",
    "name": "Островок!",
    "logo": "https://favicon.yandex.net/favicon/v2/ostrovok.ru?size=120",
    "category": "Путешествия и туризм",
    "categorySlug": "puteshestviya-i-turizm",
    "about": "Островок! - это сервис онлайн-бронирования жилья в 220 странах мира. Более 2 600 000 вариантов размещения (из них более 180 000 - в России). Независимо от того, ищете ли вы роскошный отель, уютный гостевой дом, экзотический кемпинг или уникальный дом в деревне, Островок - идеальный вариант, чтобы сделать ваш отдых незабываемым.",
    "conditions": "Промокод суммируется с акциями сервиса. Промокод можно применить только для брони с оплатой онлайн. На отели с оплатой при заселении скидка не распространяется. Не более одного применения на один аккаунт пользователя.",
    "site": "https://ostrovok.ru/",
    "activeBloggers": 4789
  },
  "otello": {
    "id": 2288,
    "slug": "otello",
    "name": "Отелло",
    "logo": "https://favicon.yandex.net/favicon/v2/otello.2gis.ru?size=120",
    "category": "Путешествия и туризм",
    "categorySlug": "puteshestviya-i-turizm",
    "about": "Отелло - надежный сервис удобного бронирования отелей, апартаментов, гостевых домов и санаториев для ваших путешествий по России и за рубежом.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://otello.2gis.ru/",
    "activeBloggers": 6813
  },
  "perekrestok-dostavka": {
    "id": 4328,
    "slug": "perekrestok-dostavka",
    "name": "Перекрёсток Доставка",
    "logo": "https://favicon.yandex.net/favicon/v2/www.perekrestok.ru?size=120",
    "category": "Доставка продуктов",
    "categorySlug": "dostavka-produktov",
    "about": "Перекрёсток Доставка продуктов - мобильное приложение, где можно заказать доставку или оформить самовывоз продуктов, готовой еды, товаров для дома и зоотоваров из более чем 900 магазинов России. Внутри - более 35 000 позиций, бонусная карта системы лояльности «Х5 Клуба», а также персональные предложения и акции.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.perekrestok.ru/",
    "activeBloggers": 2859
  },
  "plati-po-miru": {
    "id": 4362,
    "slug": "plati-po-miru",
    "name": "Плати по миру",
    "logo": "https://favicon.yandex.net/favicon/v2/platipomiru.com?size=120",
    "category": "Сервисы и подписки",
    "categorySlug": "servisy-i-podpiski",
    "about": "Плати по всему миру - это сервис, который выпускает виртуальные карты для оплаты в Amazon, Spotify, ChatGPT, Netflix и других зарубежных сервисах, а также для покупок в любой точке мира. Выпуск карты онлайн за 2 минуты через Telegram, с бесплатным первым годом обслуживания и пополнением рублями через СБП без комиссии.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://platipomiru.com/",
    "activeBloggers": 1448
  },
  "otp-bank": {
    "id": 4700,
    "slug": "otp-bank",
    "name": "ОТП Банк",
    "logo": "https://favicon.yandex.net/favicon/v2/www.otpbank.ru?size=120",
    "category": "Сервисы и подписки",
    "categorySlug": "servisy-i-podpiski",
    "about": "ОТП Банк - один из ведущих универсальных банков России. Оформление дебетовых карт МИР с бесплатным обслуживанием и сертификатами на 2000 ₽ в подарок.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.otpbank.ru/",
    "activeBloggers": 1520
  },
  "poizon": {
    "id": 4176,
    "slug": "poizon",
    "name": "Poizon",
    "logo": "https://favicon.yandex.net/favicon/v2/poizon.com?size=120",
    "category": "Маркетплейсы",
    "categorySlug": "marketpleysy",
    "about": "Poizon - это китайский маркетплейс, на котором можно купить более 2 млн товаров: оригинальную обувь, одежду и технику от частных продавцов, а также напрямую от производителя без комиссии по ценам на 40-50% дешевле, чем в российских розничных магазинах. 100% оригинальная продукция с быстрой доставкой от 10 дней. Первое и единственное официальное приложение в России.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://poizon.com",
    "activeBloggers": 2321
  },
  "premier": {
    "id": 45863,
    "slug": "premier",
    "name": "PREMIER",
    "logo": "https://favicon.yandex.net/favicon/v2/premier.one?size=120",
    "category": "Онлайн-кинотеатры",
    "categorySlug": "onlayn-kinoteatry",
    "about": "PREMIER - онлайн-кинотеатр с эксклюзивными российскими сериалами, фильмами и шоу собственного производства.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://premier.one",
    "activeBloggers": 1500
  },
  "pyaterochka": {
    "id": 4264,
    "slug": "pyaterochka",
    "name": "Пятёрочка Доставка",
    "logo": "https://favicon.yandex.net/favicon/v2/5ka.ru?size=120",
    "category": "Доставка продуктов",
    "categorySlug": "dostavka-produktov",
    "about": "Пятёрочка - мобильное приложение, в котором можно заказать доставку продуктов и готовой еды от 30 минут более чем в 700 городах, воспользоваться общей бонусной картой системы лояльности «Х5 Клуба», быстро и удобно отслеживать акции и скидки.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://5ka.ru/",
    "activeBloggers": 5006
  },
  "riv-gosh": {
    "id": 100003,
    "slug": "riv-gosh",
    "name": "РИВ ГОШ",
    "logo": "https://favicon.yandex.net/favicon/v2/rivegauche.ru?size=120",
    "category": "Косметика и парфюмерия",
    "categorySlug": "kosmetika-i-parfyumeriya",
    "about": "РИВ ГОШ - ведущая российская сеть парфюмерии и косметики мировых брендов.",
    "conditions": "Скидки по промокодам действуют в интернет-магазине РИВ ГОШ на выделенный ассортимент.",
    "site": "https://rivegauche.ru",
    "activeBloggers": 8
  },
  "rutube": {
    "id": 3758,
    "slug": "rutube",
    "name": "RUTUBE",
    "logo": "https://favicon.yandex.net/favicon/v2/rutube.ru?size=120",
    "category": "Онлайн-кинотеатры",
    "categorySlug": "onlayn-kinoteatry",
    "about": "RUTUBE - российская видеоплатформа для просмотра сериалов, шоу, блогов и новостей. Здесь можно смотреть эксклюзивный контент, недоступный на других платформах, есть доступ к премьерам сериалов, шоу или фильмов до официальных премьер. Работает без ВПН!",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://rutube.ru/",
    "activeBloggers": 2503
  },
  "samokat": {
    "id": 100002,
    "slug": "samokat",
    "name": "Самокат",
    "logo": "https://favicon.yandex.net/favicon/v2/samokat.ru?size=120",
    "category": "Доставка продуктов",
    "categorySlug": "dostavka-produktov",
    "about": "«Самокат» - сервис мгновенной доставки продуктов и товаров для дома от 15 минут.",
    "conditions": "Промокоды применяются при оформлении заказа в мобильном приложении Самокат.",
    "site": "https://samokat.ru",
    "activeBloggers": 18
  },
  "sberprime": {
    "id": 5030,
    "slug": "sberprime",
    "name": "СберПрайм",
    "logo": "https://favicon.yandex.net/favicon/v2/sberbank.ru?size=120",
    "category": "Сервисы и подписки",
    "categorySlug": "servisy-i-podpiski",
    "about": "СберПрайм - единая подписка на сервисы: фильмы в Okko, музыка в Звуке, бесплатная доставка и повышенный кэшбэк бонусами Спасибо на покупки и игры на GamersHub.",
    "conditions": "Промокод не требуется. Перейдите по ссылке и оформите подписку. Открывать через российские браузеры.",
    "site": "https://sberbank.ru",
    "activeBloggers": 15400
  },
  "sberzdorovie": {
    "id": 3468,
    "slug": "sberzdorovie",
    "name": "СберЗдоровье",
    "logo": "https://favicon.yandex.net/favicon/v2/sberhealth.ru?size=120",
    "category": "Аптека и здоровье",
    "categorySlug": "zdorove-i-vitaminy",
    "about": "СберЗдоровье - компания №1 в сфере цифровой медицины, которая предоставляет услуги по поиску и подбору врачей, онлайн-консультациям с врачами, дистанционному мониторингу.Онлайн-консультация с врачом от СберЗдоровья позволяет быстро связаться с опытным врачом и получить рекомендации по вопросам здоровья, диагностике симптомов или уточнению назначений.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://sberhealth.ru/",
    "activeBloggers": 1152
  },
  "sokolov-offline": {
    "id": 100004,
    "slug": "sokolov-offline",
    "name": "SOKOLOV",
    "logo": "https://favicon.yandex.net/favicon/v2/sokolov.ru?size=120",
    "category": "Украшения и часы",
    "categorySlug": "ukrasheniya",
    "about": "SOKOLOV - крупнейший российский ювелирный бренд украшений из золота и серебра.",
    "conditions": "Купоны действуют в розничных флагманских магазинах и на сайте SOKOLOV.",
    "site": "https://sokolov.ru",
    "activeBloggers": 15
  },
  "sunlight-ru": {
    "id": 1100,
    "slug": "sunlight-ru",
    "name": "SUNLIGHT",
    "logo": "https://favicon.yandex.net/favicon/v2/sunlight.net?size=120",
    "category": "Украшения и часы",
    "categorySlug": "ukrasheniya",
    "about": "SUNLIGHT - федеральная ювелирная сеть в России, представляющая широкий ассортимент украшений из золота, серебра и драгоценных камней.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://sunlight.net/",
    "activeBloggers": 5115
  },
  "t-puteshestviya-oteli": {
    "id": 3285,
    "slug": "t-puteshestviya-oteli",
    "name": "Т-Путешествия. Отели",
    "logo": "https://favicon.yandex.net/favicon/v2/www.tbank.ru?size=120",
    "category": "Путешествия и туризм",
    "categorySlug": "puteshestviya-i-turizm",
    "about": "Т-Путешествия – сервис бронирования отелей, гостиниц, апартаментов и туров от Т-Банка с выгодным кешбэком и скидками по промокодам.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.tbank.ru/travel/",
    "activeBloggers": 940
  },
  "tanukifamily": {
    "id": 602,
    "slug": "tanukifamily",
    "name": "Тануки",
    "logo": "https://favicon.yandex.net/favicon/v2/tanukifamily.ru?size=120",
    "category": "Доставка из ресторанов",
    "categorySlug": "dostavka-iz-restoranov",
    "about": "Тануки – сеть ресторанов японской кухни. Не просто ресторан, а самобытная культура Японии на территории России, которой можно насладиться у себя дома. Это одна из самых быстрорастущих ресторанных сетей, которая насчитывает 74 заведения.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://tanukifamily.ru",
    "activeBloggers": 8447
  },
  "tehnopark": {
    "id": 100010,
    "slug": "tehnopark",
    "name": "Технопарк",
    "logo": "https://favicon.yandex.net/favicon/v2/tehnopark.ru?size=120",
    "category": "Электроника и техника",
    "categorySlug": "elektronika-i-tehnika",
    "about": "«Технопарк» - сеть магазинов премиальной электроники, бытовой техники и инновационных гаджетов.",
    "conditions": "Промокод вводится на этапе оформления заказа в интернет-магазине Технопарк.",
    "site": "https://tehnopark.ru",
    "activeBloggers": 11
  },
  "tutu": {
    "id": 3000,
    "slug": "tutu",
    "name": "Туту",
    "logo": "https://favicon.yandex.net/favicon/v2/www.tutu.ru?size=120",
    "category": "Путешествия и туризм",
    "categorySlug": "puteshestviya-i-turizm",
    "about": "«Туту» - российский сервис путешествий, где можно спланировать поездку по России и за рубеж: сравнить варианты транспорта, купить авиа-, ж/д и автобусные билеты, забронировать отель или тур.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.tutu.ru/",
    "activeBloggers": 1425
  },
  "vazhnaya-ryba": {
    "id": 1977,
    "slug": "vazhnaya-ryba",
    "name": "Важная Рыба",
    "logo": "https://favicon.yandex.net/favicon/v2/vipfish.ru?size=120",
    "category": "Доставка из ресторанов",
    "categorySlug": "dostavka-iz-restoranov",
    "about": "Важная Рыба - быстрая доставка японской еды по Санкт-Петербургу и области! Получите заказ от 30 минут. В меню - более 200 блюд японской кухни, приготовленных из отборных ингредиентов с авторским подходом к вкусу.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://vipfish.ru/",
    "activeBloggers": 3660
  },
  "vkusvill-dostavka": {
    "id": 1341,
    "slug": "vkusvill-dostavka",
    "name": "ВкусВилл Доставка",
    "logo": "https://favicon.yandex.net/favicon/v2/vkusvill.ru?size=120",
    "category": "Доставка продуктов",
    "categorySlug": "dostavka-produktov",
    "about": "ВкусВилл - сеть магазинов вкусных и полезных продуктов с честным составом для здорового питания. Сейчас в сети более 1800 торговых точек в 157 городах России. Здесь продаются натуральные продукты, уходовая косметика, товары для дома, детей и животных, которые можно заказать с быстрой и бесплатной доставкой от 2х часов на дом. Также сервис бесплатно доставляет продукты за город!",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://vkusvill.ru",
    "activeBloggers": 14961
  },
  "winlab": {
    "id": 1409,
    "slug": "winlab",
    "name": "ВинЛаб",
    "logo": "https://favicon.yandex.net/favicon/v2/www.winelab.ru?size=120",
    "category": "Продукты и напитки",
    "categorySlug": "produkty-i-napitki",
    "about": "ВинЛаб – специализированная торговая сеть, которая предлагает покупателям широкий выбор алкогольных и безалкогольных напитков во всех популярных категориях.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://www.winelab.ru/",
    "activeBloggers": 3089
  },
  "yandeks-lavka": {
    "id": 354,
    "slug": "yandeks-lavka",
    "name": "Яндекс Лавка",
    "logo": "https://favicon.yandex.net/favicon/v2/lavka.yandex?size=120",
    "category": "Доставка продуктов",
    "categorySlug": "dostavka-produktov",
    "about": "«Яндекс Лавка» - сервис быстрой доставки продуктов питания, готовой еды и товаров для дома от 15 минут.",
    "conditions": "Скидки по промокодам применяются при оформлении заказа в приложении и на сайте Яндекс Лавки.",
    "site": "https://lavka.yandex",
    "activeBloggers": 120
  },
  "yandeks-puteshestviya": {
    "id": 1135,
    "slug": "yandeks-puteshestviya",
    "name": "Яндекс Путешествия",
    "logo": "https://favicon.yandex.net/favicon/v2/travel.yandex.ru?size=120",
    "category": "Путешествия и туризм",
    "categorySlug": "puteshestviya-i-turizm",
    "about": "Яндекс Путешествия - один из самых удобных сервисов для онлайн-бронирования жилья, по мнению пользователей.Здесь можно забронировать номер и оплатить его без комиссии и переплаты, а еще купить авиа и ж/д билеты на разные направления.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://travel.yandex.ru",
    "activeBloggers": 13747
  },
  "yandeks-tsvety": {
    "id": 3750,
    "slug": "yandeks-tsvety",
    "name": "Яндекс Цветы",
    "logo": "https://favicon.yandex.net/favicon/v2/eda.yandex.ru?size=120",
    "category": "Цветы и подарки",
    "categorySlug": "tsvety",
    "about": "Яндекс Цветы - приложение для удобного заказа букетов из магазинов. Здесь можно заказать как недорогие букеты, так и премиальные композиции: от привычных роз до экзотических цветов - глориозы, протеи, эустомы и др.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://eda.yandex.ru/collections/flowers_department",
    "activeBloggers": 2196
  },
  "yandex-eda": {
    "id": 1384,
    "slug": "yandex-eda",
    "name": "Яндекс Еда",
    "logo": "https://favicon.yandex.net/favicon/v2/eda.yandex.ru?size=120",
    "category": "Доставка из ресторанов",
    "categorySlug": "dostavka-iz-restoranov",
    "about": "Яндекс Еда Рестораны - сервис от Яндекса по доставке готовой еды из любимых кафе и ресторанов, где можно отбирать заведения по времени доставки, кухне, рейтингу и др. критериям, а также копить и тратить баллы Яндекс Плюса.",
    "conditions": "Условия и сроки действия актуальных предложений указаны в карточках промокодов.",
    "site": "https://eda.yandex.ru/",
    "activeBloggers": 10189
  },
  "yandex-eda-gipermarkety": {
    "id": 1408,
    "slug": "yandex-eda-gipermarkety",
    "name": "Яндекс Еда Гипермаркеты",
    "logo": "https://favicon.yandex.net/favicon/v2/eda.yandex.ru?size=120",
    "category": "Доставка продуктов",
    "categorySlug": "dostavka-produktov",
    "about": "Доставка продуктов и товаров для дома из гипермаркетов через сервис Яндекс Еда: Ашан, Лента, МЕТРО, ВкусВилл, Магнит и других с доставкой до двери.",
    "conditions": "Скидка 550 ₽ на заказ из гипермаркетов в сервисе Яндекс Еда по промокоду до 31.10.2026.",
    "site": "https://eda.yandex.ru/collections/eda_gipera",
    "activeBloggers": 5420
  },
  "yandex-market": {
    "id": 100007,
    "slug": "yandex-market",
    "name": "Яндекс Маркет",
    "logo": "https://favicon.yandex.net/favicon/v2/market.yandex.ru?size=120",
    "category": "Маркетплейсы",
    "categorySlug": "marketpleysy",
    "about": "«Яндекс Маркет» - популярный маркетплейс с миллионами товаров, быстрой доставкой и бонусами Яндекс Плюс.",
    "conditions": "Скидки по промокодам применяются в корзине при оформлении заказа на сайте и в приложении.",
    "site": "https://market.yandex.ru",
    "activeBloggers": 25
  },
  "yandex-plus": {
    "id": 2233,
    "slug": "yandex-plus",
    "name": "Яндекс Плюс",
    "logo": "https://favicon.yandex.net/favicon/v2/plus.yandex.ru?size=120",
    "category": "Сервисы и подписки",
    "categorySlug": "servisy-i-podpiski",
    "about": "Яндекс Плюс - единая мультиподписка на сервисы Яндекса, включая Кинопоиск, Яндекс Музыку и Яндекс Книги. Мультиподписка позволяет копить и тратить баллы Плюса. Баллами можно оплатить как часть, так и полную стоимость товаров, услуг и билетов в сервисах Яндекса: Яндекс Go (такси и самокаты), Драйв, Яндекс Афиша, Кинопоиск, Яндекс Маркет, Заправки, Еда, Лавка, Путешествия.",
    "conditions": "Условия мультиподписки Яндекс Плюс: clck.ru/FMQND. Условия использования промокода: уа.cc/pk. Предложение до 30.11.2025 г. Есть ограничения, подробнее здесь .",
    "site": "https://plus.yandex.ru",
    "activeBloggers": 4676
  },
  "zolotoe-yabloko": {
    "id": 100008,
    "slug": "zolotoe-yabloko",
    "name": "Золотое Яблоко",
    "logo": "https://favicon.yandex.net/favicon/v2/goldapple.ru?size=120",
    "category": "Косметика и парфюмерия",
    "categorySlug": "kosmetika-i-parfyumeriya",
    "about": "«Золотое Яблоко» - флагманский парфюмерный супермаркет: косметика, парфюмерия и бьюти-новинки.",
    "conditions": "Промокоды вводятся на шаге оплаты в интернет-магазине Золотое Яблоко.",
    "site": "https://goldapple.ru",
    "activeBloggers": 16
  }
};
