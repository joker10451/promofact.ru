import type { MetadataRoute } from "next";
import { getCategories, getAllStores, getCoupons } from "@/lib/perfluence";
import { getArticles } from "@/lib/articles";
import { ACTIONS } from "@/lib/actions";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { COLLECTIONS } from "@/lib/collections";
import { SITE_URL } from "@/lib/site";
import { canonicalCategorySlug } from "@/lib/categoryTaxonomy";
import syncMeta from "@/data/sync-meta.json";

// sitemap.ts — Dynamic Route Handler
// Содержит ТОЛЬКО канонические, индексируемые страницы.
// Исключены неканонические подстраницы /store/[slug]/[code] (их canonical -> /store/[slug]).
// Исключены служебные и закрытые страницы (/admin, /partner/yookassa).
// Исключены пустые (0) и тонкие (< 3) страницы гео-категорий /gorod/[slug]/[category].
//
// Политика lastModified:
// - Для страниц со значимыми изменениями указываются реальные даты (статьи -> published,
//   магазины/категории/каталог -> дата подтверждённой синхронизации каталога syncMeta.lastSuccessSync).
// - Для страниц без достоверных дат изменения lastModified опускается согласно стандарту sitemap.org.
// - Запрещено использовать произвольные фиктивные даты.
export const revalidate = false;

const CATALOG_SYNC_DATE = syncMeta.lastSuccessSync ? new Date(syncMeta.lastSuccessSync) : undefined;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, stores, coupons] = await Promise.all([
    getCategories(),
    getAllStores(),
    getCoupons(),
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

  // Категории: дата синхронизации только если в категории есть живые промокоды.
  // Дедуплицируем по каноническому slug (canonicalCategorySlug), исключая алиасы из sitemap.
  const seenCategorySlugs = new Set<string>();
  const categoryMap: MetadataRoute.Sitemap = [];

  for (const cat of categories) {
    const canonicalSlug = canonicalCategorySlug(cat.slug);
    if (seenCategorySlugs.has(canonicalSlug)) {
      continue;
    }
    seenCategorySlugs.add(canonicalSlug);

    const hasActiveInCat = stores.some((s) => {
      const storeCat = canonicalCategorySlug(s.categorySlug || "");
      return storeCat === canonicalSlug && Array.isArray(s.coupons) && s.coupons.length > 0;
    });

    categoryMap.push({
      url: `${SITE_URL}/category/${canonicalSlug}`,
      ...(hasActiveInCat && CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: hasActiveInCat ? ("daily" as const) : ("weekly" as const),
      priority: 0.8,
    });
  }

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

  // Гео-категории: только содержательные страницы с достаточной ценностью (list.length >= 3).
  // Пустые (0) и тонкие (< 3) страницы исключены для предотвращения размытия индекса.
  // Категории нормализуются до канонического slug.
  const geoCategoryMap: MetadataRoute.Sitemap = [];
  const seenGeoCategories = new Set<string>();

  for (const city of CITIES_SEO) {
    for (const cat of categories) {
      const canonicalSlug = canonicalCategorySlug(cat.slug);
      const geoKey = `${city.slug}/${canonicalSlug}`;
      if (seenGeoCategories.has(geoKey)) {
        continue;
      }

      const list = coupons.filter((c) => {
        const r = (c.promocode?.region || "").toLowerCase();
        const isAllRu = !r || r === "вся россия" || r === "ru" || r.includes("россия");
        const matchesCity = r.includes(city.name.toLowerCase());
        const storeCat = canonicalCategorySlug(c.store.categorySlug || "");
        return (isAllRu || matchesCity) && storeCat === canonicalSlug;
      });
      if (list.length >= 3) {
        seenGeoCategories.add(geoKey);
        geoCategoryMap.push({
          url: `${SITE_URL}/gorod/${city.slug}/${canonicalSlug}`,
          ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
          changeFrequency: "weekly" as const,
          priority: 0.75,
        });
      }
    }
  }

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
    ...geoCategoryMap,
    ...promokodyMap,
    ...tipsMap,
    ...actionsMap,
    ...miscMap,
  ];
}
