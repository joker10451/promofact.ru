import type { MetadataRoute } from "next";
import { getCategories, getCoupons, getStores } from "@/lib/perfluence";
import { ARTICLES } from "@/lib/articles";
import { ACTIONS } from "@/lib/actions";
import { SITE_URL } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [coupons, categories, stores] = await Promise.all([
    getCoupons(),
    getCategories(),
    getStores(),
  ]);
  const today = new Date();
  const lastModified = coupons.reduce((max, c) => {
    const t = new Date(c.promocode.expires ?? "");
    return Number.isNaN(t.getTime()) ? max : t > max ? t : max;
  }, today);

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: today,
      changeFrequency: "daily",
      priority: 1,
    },
  ];
  const categoryMap: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/category/${cat.slug}`,
    lastModified: today,
    changeFrequency: "daily",
    priority: 0.7,
  }));
  const storeMap: MetadataRoute.Sitemap = stores.flatMap((store) => [
    {
      url: `${SITE_URL}/store/${store.slug}`,
      lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    },
    ...store.coupons
      .filter((c) => c.promocode.code)
      .map((c) => ({
        url: `${SITE_URL}/store/${store.slug}/${c.promocode.code}`,
        lastModified,
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
  ]);
  const tipsMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/sovety`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    ...ARTICLES.map((a) => ({
      url: `${SITE_URL}/sovety/${a.slug}`,
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.5,
    })),
  ];

  const actionsMap: MetadataRoute.Sitemap = ACTIONS.map((a) => ({
    url: `${SITE_URL}/actions/${a.slug}`,
    lastModified: today,
    changeFrequency: "monthly" as const,
    priority: 0.55,
  }));

  const miscMap: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/sitemap-html`, lastModified: today, changeFrequency: "daily" as const, priority: 0.3 },
    { url: `${SITE_URL}/partner/yookassa`, lastModified: today, changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  return [...home, ...categoryMap, ...storeMap, ...tipsMap, ...actionsMap, ...miscMap];
}
