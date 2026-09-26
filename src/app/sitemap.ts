import type { MetadataRoute } from "next";
import { getCategories, getAllStores } from "@/lib/perfluence";
import { getArticles } from "@/lib/articles";
import { ACTIONS } from "@/lib/actions";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { COLLECTIONS } from "@/lib/collections";
import { SITE_URL } from "@/lib/site";
import syncMeta from "@/data/sync-meta.json";

// sitemap.ts — Dynamic Route Handler
// Содержит ТОЛЬКО 100% канонические, индексируемые страницы (Quality Gate).
// Подстраницы купонов (/store/[slug]/[code]) исключены, так как их canonical
// указывает на родительский магазин /store/[slug].
// lastModified вычисляется на основе реальных дат обновления контента (sync-meta, даты публикаций, статические даты),
// а не фиктивного new Date(), что критично для доверия поисковых роботов (Яндекс/Google).
export const revalidate = false;

const DEFAULT_SYNC_DATE = new Date(syncMeta.lastSuccessSync || "2026-09-26T16:46:19.000Z");
const STATIC_PAGE_DATE = new Date("2026-08-01T00:00:00.000Z");
const CITIES_PAGE_DATE = new Date("2026-09-01T00:00:00.000Z");
const COLLECTIONS_PAGE_DATE = new Date("2026-09-05T00:00:00.000Z");
const FALLBACK_STORE_DATE = new Date("2026-08-15T00:00:00.000Z");

const ACTION_DATES: Record<string, Date> = {
  "pervoe-sentyabrya": new Date("2026-08-25T00:00:00.000Z"),
  "puteshestviya": new Date("2026-08-01T00:00:00.000Z"),
  "leto-2026": new Date("2026-06-01T00:00:00.000Z"),
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, stores] = await Promise.all([
    getCategories(),
    getAllStores(),
  ]);

  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: DEFAULT_SYNC_DATE,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  const storeMap: MetadataRoute.Sitemap = stores.map((store) => {
    const hasLiveCoupons = store.coupons && store.coupons.length > 0;
    return {
      url: `${SITE_URL}/store/${store.slug}`,
      lastModified: hasLiveCoupons ? DEFAULT_SYNC_DATE : FALLBACK_STORE_DATE,
      changeFrequency: hasLiveCoupons ? ("daily" as const) : ("weekly" as const),
      priority: hasLiveCoupons ? 0.9 : 0.7,
    };
  });

  const categoryMap: MetadataRoute.Sitemap = categories.map((cat) => {
    const hasActiveInCat = stores.some(
      (s) => s.categorySlug === cat.slug && s.coupons && s.coupons.length > 0
    );
    return {
      url: `${SITE_URL}/category/${cat.slug}`,
      lastModified: hasActiveInCat ? DEFAULT_SYNC_DATE : FALLBACK_STORE_DATE,
      changeFrequency: hasActiveInCat ? ("daily" as const) : ("weekly" as const),
      priority: 0.8,
    };
  });

  const collectionsMap: MetadataRoute.Sitemap = COLLECTIONS.map((col) => ({
    url: `${SITE_URL}/collections/${col.slug}`,
    lastModified: COLLECTIONS_PAGE_DATE,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const citiesMap: MetadataRoute.Sitemap = CITIES_SEO.map((city) => ({
    url: `${SITE_URL}/gorod/${city.slug}`,
    lastModified: CITIES_PAGE_DATE,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  const allArticles = getArticles();
  const latestArticleDate = allArticles.reduce((latest, a) => {
    const d = a.published ? new Date(a.published) : FALLBACK_STORE_DATE;
    return d > latest ? d : latest;
  }, FALLBACK_STORE_DATE);

  const tipsMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/sovety`,
      lastModified: latestArticleDate,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...allArticles.map((a) => ({
      url: `${SITE_URL}/sovety/${a.slug}`,
      lastModified: a.published ? new Date(a.published) : FALLBACK_STORE_DATE,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  const actionsMap: MetadataRoute.Sitemap = ACTIONS.map((a) => ({
    url: `${SITE_URL}/akcii/${a.slug}`,
    lastModified: ACTION_DATES[a.slug] || STATIC_PAGE_DATE,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  const miscMap: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/sitemap-html`, lastModified: DEFAULT_SYNC_DATE, changeFrequency: "daily" as const, priority: 0.3 },
    { url: `${SITE_URL}/about`, lastModified: STATIC_PAGE_DATE, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE_URL}/contacts`, lastModified: STATIC_PAGE_DATE, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE_URL}/privacy`, lastModified: STATIC_PAGE_DATE, changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${SITE_URL}/partner/yookassa`, lastModified: CITIES_PAGE_DATE, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${SITE_URL}/partner/netprint`, lastModified: CITIES_PAGE_DATE, changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  const promokodyMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/promokody`,
      lastModified: DEFAULT_SYNC_DATE,
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
