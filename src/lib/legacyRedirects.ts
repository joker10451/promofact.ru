/**
 * Устаревшие slug'ы магазинов/категорий из старых мок-данных и внешних ссылок.
 * Реальный Perfluence API отдаёт другие slug'и, поэтому старые URL'ы вели в 404.
 * Чтобы поисковики и пользователи не попадали на битые страницы, делаем 301-редирект
 * на ближайшую по смыслу живую категорию.
 */
export const LEGACY_STORE_REDIRECTS: Record<string, string> = {
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
