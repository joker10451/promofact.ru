function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelUrl) return `https://${vercelUrl}`;
  return "https://promodrom.ru";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "ПРОМО·ДРОМ";
export const SITE_TAGLINE = "Промокоды и купоны на скидку";
