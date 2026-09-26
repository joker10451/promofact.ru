import type { MetadataRoute } from "next";
import { getCategories, getAllStores } from "@/lib/perfluence";
import { getArticles } from "@/lib/articles";
import { ACTIONS } from "@/lib/actions";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { COLLECTIONS } from "@/lib/collections";
import { SITE_URL } from "@/lib/site";
import syncMeta from "@/data/sync-meta.json";

// sitemap.ts — Dynamic Route Handler
// Содержит ТОЛЬКО канонические, индексируемые страницы.
// Исключены неканонические подстраницы /store/[slug]/[code] (их canonical -> /store/[slug]).
// Исключены служебные и закрытые страницы (/admin, /partner/yookassa).
//
// Политика lastModified:
// - Для страниц со значимыми изменениями указываются реальные даты (статьи -> published,
//   магазины/категории/каталог -> дата подтверждённой синхронизации каталога syncMeta.lastSuccessSync).
// - Для страниц без достоверных дат изменения lastModified опускается согласно стандарту sitemap.org.
// - Запрещено использовать произвольные фиктивные даты.
export const revalidate = false;

const CATALOG_SYNC_DATE = syncMeta.lastSuccessSync ? new Date(syncMeta.lastSuccessSync) : undefined;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, stores] = await Promise.all([
    getCategories(),
    getAllStores(),
  ]);

  // Главная страница — витрина живых предложений
  const home: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: CATALOG_SYNC_DATE,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // Магазины: для магазинов с живыми промокодами lastModified привязан к синхронизации каталога.
  // Для магазинов без актуальных акций lastModified не выдумывается (опускается).
  const storeMap: MetadataRoute.Sitemap = stores.map((store) => {
    const hasLiveCoupons = Array.isArray(store.coupons) && store.coupons.length > 0;
    return {
      url: `${SITE_URL}/store/${store.slug}`,
      ...(hasLiveCoupons && CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: hasLiveCoupons ? ("daily" as const) : ("weekly" as const),
      priority: hasLiveCoupons ? 0.9 : 0.7,
    };
  });

  // Категории: дата синхронизации только если в категории есть живые промокоды
  const categoryMap: MetadataRoute.Sitemap = categories.map((cat) => {
    const hasActiveInCat = stores.some(
      (s) => s.categorySlug === cat.slug && Array.isArray(s.coupons) && s.coupons.length > 0
    );
    return {
      url: `${SITE_URL}/category/${cat.slug}`,
      ...(hasActiveInCat && CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: hasActiveInCat ? ("daily" as const) : ("weekly" as const),
      priority: 0.8,
    };
  });

  // Подборки: статические агрегаторы без выдуманных дат
  const collectionsMap: MetadataRoute.Sitemap = COLLECTIONS.map((col) => ({
    url: `${SITE_URL}/collections/${col.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Города: региональные страницы без выдуманных дат
  const citiesMap: MetadataRoute.Sitemap = CITIES_SEO.map((city) => ({
    url: `${SITE_URL}/gorod/${city.slug}`,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // База знаний / советы: реальные даты публикаций статей
  const allArticles = getArticles();
  let latestArticleDate: Date | undefined;
  for (const a of allArticles) {
    if (a.published) {
      const d = new Date(a.published);
      if (!isNaN(d.getTime()) && (!latestArticleDate || d > latestArticleDate)) {
        latestArticleDate = d;
      }
    }
  }

  const tipsMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/sovety`,
      ...(latestArticleDate ? { lastModified: latestArticleDate } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    },
    ...allArticles.map((a) => {
      const pubDate = a.published ? new Date(a.published) : undefined;
      const validPubDate = pubDate && !isNaN(pubDate.getTime()) ? pubDate : undefined;
      return {
        url: `${SITE_URL}/sovety/${a.slug}`,
        ...(validPubDate ? { lastModified: validPubDate } : {}),
        changeFrequency: "monthly" as const,
        priority: 0.6,
      };
    }),
  ];

  // Сезонные акции (без фиктивных дат)
  const actionsMap: MetadataRoute.Sitemap = ACTIONS.map((a) => ({
    url: `${SITE_URL}/akcii/${a.slug}`,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Служебные и партнёрские страницы (исключены /admin и тестовые /partner/yookassa)
  const miscMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/sitemap-html`,
      ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: "daily" as const,
      priority: 0.3,
    },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE_URL}/contacts`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${SITE_URL}/partner/netprint`, changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  const promokodyMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/promokody`,
      ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
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
