import type { MetadataRoute } from "next";
import { getCategories, getCoupons, getStores } from "@/lib/perfluence";
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
  const storeMap: MetadataRoute.Sitemap = stores.map((store) => ({
    url: `${SITE_URL}/store/${store.slug}`,
    lastModified,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  return [...home, ...categoryMap, ...storeMap];
}
