import type { MetadataRoute } from "next";
import { getCategories, getAllStores, getCoupons } from "@/lib/perfluence";
import { getArticles } from "@/lib/articles";
import { ACTIONS } from "@/lib/actions";
import { CITIES_SEO } from "@/lib/citiesSeo";
import { COLLECTIONS, getCollectionCoupons, MIN_INDEXABLE_COLLECTION_OFFERS } from "@/lib/collections";
import { SITE_URL } from "@/lib/site";
import { canonicalCategorySlug } from "@/lib/categoryTaxonomy";
import syncMeta from "@/data/sync-meta.json";
import { selectGeoOffers } from "@/lib/geoIndexing";

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
export const revalidate = 900; // Update indexable URLs as publisher snapshots change.

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

  // Магазины: в sitemap включаются ТОЛЬКО страницы с живыми промокодами (store.coupons.length > 0).
  // Магазины с 0 активных предложений исключаются из XML sitemap (для них действует robots: noindex, follow).
  const storeMap: MetadataRoute.Sitemap = stores
    .filter((store) => Array.isArray(store.coupons) && store.coupons.length > 0)
    .map((store) => ({
      url: `${SITE_URL}/store/${store.slug}`,
      ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: "daily" as const,
      priority: 0.9,
    }));

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

  // Only collections with enough active offers are indexable, using exactly
  // the same co-promotion restrictions as their page and robots metadata.
  const collectionsMap: MetadataRoute.Sitemap = COLLECTIONS
    .filter((col) => getCollectionCoupons(col, coupons).length >= MIN_INDEXABLE_COLLECTION_OFFERS)
    .map((col) => ({
      url: `${SITE_URL}/collections/${col.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    }));

  // Города: региональные страницы без выдуманных дат.
  // Города ищем и по полю region, и по тексту условий: фид регион почти не отдаёт.
  const CITY_NAMES = CITIES_SEO.map((city) => ({ slug: city.slug, name: city.name }));
  const citiesMap: MetadataRoute.Sitemap = CITIES_SEO.filter((city) =>
    selectGeoOffers(coupons, city.name, undefined, CITY_NAMES).indexable,
  ).map((city) => ({
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

      if (selectGeoOffers(coupons, city.name, canonicalSlug, CITY_NAMES).indexable) {
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

  const PEAK_GUIDE_SLUGS = new Set([
    "gid-po-rasprodazhe-11-11-2026",
    "chernaya-pyatnica-2026",
    "podarki-na-novyy-god-2027-skidki",
    "laifhaki-shoppinga-na-marketpleysah",
    "promokody-yandeks-afisha-bilety",
    "promokody-sberzdorovie-analizy-apteki",
    "cashbek-bankov-2026",
  ]);

  const tipsMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/sovety`,
      ...(latestArticleDate ? { lastModified: latestArticleDate } : {}),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    },
    ...allArticles.map((a) => {
      const pubDate = a.published ? new Date(a.published) : undefined;
      const validPubDate = pubDate && !isNaN(pubDate.getTime()) ? pubDate : undefined;
      const isPeakGuide = PEAK_GUIDE_SLUGS.has(a.slug);
      return {
        url: `${SITE_URL}/sovety/${a.slug}`,
        ...(validPubDate ? { lastModified: validPubDate } : {}),
        changeFrequency: isPeakGuide ? ("weekly" as const) : ("monthly" as const),
        priority: isPeakGuide ? 0.8 : 0.6,
      };
    }),
  ];

  // Сезонные акции (без фиктивных дат): для активных распродаж осени/зимы приоритет 0.9 и ежедневный обход
  const PEAK_ACTION_SLUGS = new Set([
    "den-shopinga-11-11",
    "chernaya-pyatnica-2026",
    "novogodnie-skidki-2027",
  ]);

  const actionsMap: MetadataRoute.Sitemap = ACTIONS.map((a) => {
    const isPeakAction = PEAK_ACTION_SLUGS.has(a.slug);
    return {
      url: `${SITE_URL}/akcii/${a.slug}`,
      ...(isPeakAction && CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: isPeakAction ? ("daily" as const) : ("monthly" as const),
      priority: isPeakAction ? 0.9 : 0.6,
    };
  });

  // Служебные и партнёрские страницы (исключены /admin и тестовые /partner/yookassa)
  const miscMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/sitemap-html`,
      ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: "daily" as const,
      priority: 0.3,
    },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE_URL}/calculator`, changeFrequency: "monthly" as const, priority: 0.4 },
    { url: `${SITE_URL}/guide`, changeFrequency: "monthly" as const, priority: 0.6 },
    { url: `${SITE_URL}/contacts`, changeFrequency: "monthly" as const, priority: 0.3 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "monthly" as const, priority: 0.2 },
    { url: `${SITE_URL}/partner/netprint`, changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  const promokodyMap: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/category`,
      ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: "daily" as const,
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/catalog`,
      ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: "daily" as const,
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/promokody`,
      ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: "daily" as const,
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/collections`,
      ...(CATALOG_SYNC_DATE ? { lastModified: CATALOG_SYNC_DATE } : {}),
      changeFrequency: "daily" as const,
      priority: 0.85,
    },
    {
      url: `${SITE_URL}/gorod`,
      changeFrequency: "weekly" as const,
      priority: 0.85,
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
