/**
 * Логотипы из CDN Admitad отдаём через свой домен.
 *
 * Встроенные блокировщики рекламы (в Яндекс Браузере — по умолчанию) режут
 * всё с `cdn.admitad.com`: в карточках оставались пустые квадраты. Путь
 * `/media/l/…` проксируется в next.config.ts и не похож на рекламный.
 */
const ADMITAD_CDN = "https://cdn.admitad.com/campaign/images/";
export const LOGO_PROXY_PREFIX = "/media/l/";

export function proxiedLogo(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.startsWith(ADMITAD_CDN)) return LOGO_PROXY_PREFIX + url.slice(ADMITAD_CDN.length);
  return url;
}
