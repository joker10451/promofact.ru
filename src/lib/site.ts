function resolveSiteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
  const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL;
  if (vercelEnv !== "production" && vercelUrl) return `https://${vercelUrl}`;
  return "https://promofact.ru";
}

export const SITE_URL = resolveSiteUrl();
export const SITE_NAME = "ПромоФакт";
export const SITE_TAGLINE = "Промокоды и купоны на скидку";

export const CHANNELS = {
  telegram: "https://t.me/smart_zakupka",
  youtube: "https://www.youtube.com/@SmartShopping-o9k",
  dzen: "https://dzen.ru/id/66d486816000f25d542e7180",
};
