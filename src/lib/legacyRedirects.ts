/**
 * Устаревшие slug'ы магазинов/категорий из старых мок-данных и внешних ссылок.
 * Реальный Perfluence API отдаёт другие slug'и, поэтому старые URL'ы вели в 404.
 * Чтобы поисковики и пользователи не попадали на битые страницы, делаем 301-редирект
 * на ближайшую по смыслу живую категорию.
 */
export const LEGACY_STORE_REDIRECTS: Record<string, string> = {
  ostin: "/category/marketpleysy",
  hoff: "/category/marketpleysy",
  "m-video": "/store/mvideo",
  vkusvill: "/category/dostavka-produktov",
  s7: "/category/puteshestviya-i-turizm",
};

export const LEGACY_CATEGORY_REDIRECTS: Record<string, string> = {
  elektronika: "/category/marketpleysy",
  odezhda: "/category/marketpleysy",
  odezhda_i_obuv: "/category/marketpleysy",
  "sport-i-otdykh": "/category/marketpleysy",
  krasota: "/category/kosmetika-i-parfyumeriya",
};
