import type { MetadataRoute } from "next";
import { getCategories, getAllStores } from "@/lib/perfluence";
import { ARTICLES } from "@/lib/articles";
import { ACTIONS } from "@/lib/actions";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { COLLECTIONS } from "@/lib/collections";
import { SITE_URL } from "@/lib/site";

// sitemap.ts — Dynamic Route Handler
// Содержит ТОЛЬКО 100% канонические, индексируемые страницы (Quality Gate).
// Подстраницы купонов (/store/[slug]/[code]) исключены, так как их canonical
// указывает на родительский магазин /store/[slug] — включение неканонических
// URL в Sitemap признаётся поисковиками ошибкой и размывает краулинговый бюджет.
export const revalidate = 43200;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, stores] = await Promise.all([
    getCategories(),
    getAllStores(),
  ]);

  const today = new Date();

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: today,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const storeMap: MetadataRoute.Sitemap = stores.flatMap((store) => [
    {
      url: `${SITE_URL}/store/${store.slug}`,
      lastModified: today,
      changeFrequency: "daily" as const,
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/store/${store.slug}/first-order`,
      lastModified: today,
      changeFrequency: "daily" as const,
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/store/${store.slug}/repeat-order`,
      lastModified: today,
      changeFrequency: "daily" as const,
      priority: 0.85,
    },
  ]);

  const categoryMap: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${SITE_URL}/category/${cat.slug}`,
    lastModified: today,
    changeFrequency: "daily",
    priority: 0.8,
  }));

  const collectionsMap: MetadataRoute.Sitemap = COLLECTIONS.map((col) => ({
    url: `${SITE_URL}/collections/${col.slug}`,
    lastModified: today,
    changeFrequency: "daily" as const,
    priority: 0.8,
  }));

  const citiesMap: MetadataRoute.Sitemap = CITIES_SEO.map((city) => ({
    url: `${SITE_URL}/gorod/${city.slug}`,
    lastModified: today,
    changeFrequency: "daily" as const,
    priority: 0.85,
  }));

  const tipsMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/sovety`,
      lastModified: today,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    ...ARTICLES.map((a) => ({
      url: `${SITE_URL}/sovety/${a.slug}`,
      lastModified: today,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  const actionsMap: MetadataRoute.Sitemap = ACTIONS.map((a) => ({
    url: `${SITE_URL}/actions/${a.slug}`,
    lastModified: today,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const miscMap: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/sitemap-html`, lastModified: today, changeFrequency: "daily" as const, priority: 0.3 },
    { url: `${SITE_URL}/partner/yookassa`, lastModified: today, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${SITE_URL}/partner/netprint`, lastModified: today, changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  const promokodyMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/promokody`,
      lastModified: today,
      changeFrequency: "daily" as const,
      priority: 0.75,
    },
  ];

  return [
    ...home,
    ...storeMap,
    ...categoryMap,
    ...collectionsMap,
    ...citiesMap,
    ...promokodyMap,
    ...tipsMap,
    ...actionsMap,
    ...miscMap,
  ];
}
