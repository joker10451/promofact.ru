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

/**
 * Automated clients that must not be counted as visitors. A 30-day Metrika report
 * showed 361 of 534 visits from the US lasting 2 seconds with no goals: crawlers,
 * speed checkers and headless browsers (including our own CI checks of the live site).
 * Real browsers never say "bot" or "headless"; Yandex's own browser and apps are not matched.
 */
export const AUTOMATED_UA_PATTERN =
  // "bot" followed by a separator catches Googlebot/2.1, bingbot/2.0, AhrefsBot/7.0 without
  // matching phone models such as CUBOT_X30. No backslashes: they get lost in string escaping.
  "bot[/ ;)]|crawl|spider|slurp|headless|lighthouse|pagespeed|gtmetrix|pingdom|uptimerobot|" +
  "facebookexternalhit|whatsapp|python-requests|curl/|wget|axios|node-fetch|go-http|java/";

export function isAutomatedClient(userAgent: string | undefined | null, webdriver?: boolean): boolean {
  if (webdriver) return true;
  return new RegExp(AUTOMATED_UA_PATTERN, "i").test(userAgent ?? "");
}
