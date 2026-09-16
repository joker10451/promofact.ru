/**
 * Логотипы партнёрских сетей отдаём через свой домен.
 *
 * - `cdn.admitad.com` режут встроенные блокировщики рекламы (в Яндекс
 *   Браузере — по умолчанию): в карточках оставались пустые квадраты.
 * - `s3sc.perfluence.net` из России часто не отвечает (обрыв соединения),
 *   картинка висела по 5+ секунд и страница долго «грузилась».
 *
 * Пути `/media/*` проксируются в next.config.ts (LOGO_PROXIES).
 */
export const LOGO_PROXIES = [
  { prefix: "/media/l/", origin: "https://cdn.admitad.com/campaign/images/" },
  { prefix: "/media/p/", origin: "https://s3sc.perfluence.net/logos/" },
] as const;

export function proxiedLogo(url: string | null | undefined): string | null {
  if (!url) return null;
  for (const { prefix, origin } of LOGO_PROXIES) {
    if (url.startsWith(origin)) return prefix + url.slice(origin.length);
  }
  return url;
}
