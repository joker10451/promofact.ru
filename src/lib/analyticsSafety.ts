/**
 * src/lib/analyticsSafety.ts
 *
 * Безопасная очистка путей и параметров для внешней аналитики (Яндекс.Метрика и др.).
 * Предотвращает утечку сырых значений промокодов, токенов, персональных данных и query-строк.
 */

export function sanitizeAnalyticsPath(pathname: string): string {
  if (!pathname) return "/";
  // Отсекаем query-параметры и хэш, если случайно переданы
  const cleanPath = pathname.split("?")[0].split("#")[0];

  // Санитайзинг детальных страниц купонов: /store/[slug]/[code] -> /store/[slug]/coupon
  const storeCouponMatch = cleanPath.match(/^\/store\/([^/]+)\/([^/]+)$/);
  if (storeCouponMatch) {
    return `/store/${storeCouponMatch[1]}/coupon`;
  }
  return cleanPath;
}
