/**
 * Устаревшие и дублирующие slug'и магазинов/категорий.
 * Поисковики и пользователи по старым URL'ам получают 301-редирект
 * на канонический магазин или живую категорию.
 */
export const LEGACY_STORE_REDIRECTS: Record<string, string> = {
  "admitad-25914-yandex": "/category/onlayn-obrazovanie",
  "yandex-practicum": "/category/onlayn-obrazovanie",
  "admitad-23526-start": "/store/start-ru",
  foodband: "/store/food-band",
  polza: "/store/polzaru",
  "polza-ru": "/store/polzaru",
  platipomiru: "/store/plati-po-miru",
  sberbank: "/store/debetovaya-sberkarta",
  "arnest-yunirus-na-ozon": "/store/chistaya-liniya",
  ostin: "/category/marketpleysy",
  hoff: "/category/marketpleysy",
  "m-video": "/category/elektronika-i-tehnika",
  mvideo: "/category/elektronika-i-tehnika",
  wildberries: "/category/marketpleysy",
  ozon: "/category/marketpleysy",
  dns: "/category/elektronika-i-tehnika",
  vkusvill: "/category/dostavka-produktov",
  s7: "/category/puteshestviya-i-turizm",
};

export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  elektronika: "/category/elektronika-i-tehnika",
  odezhda: "/category/odezhda-i-obuv",
  odezhda_i_obuv: "/category/odezhda-i-obuv",
  "sport-i-otdykh": "/category/sport-i-otdyh",
  krasota: "/category/kosmetika-i-parfyumeriya",
};
