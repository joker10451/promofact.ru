import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PopularStores from "@/components/PopularStores";
import PrioritySearchLinks from "@/components/PrioritySearchLinks";
import ExpiringDeals from "@/components/ExpiringDeals";
import SberCampaignTeasers from "@/components/SberCampaignTeasers";
import HomeOffersPreview from "@/components/HomeOffersPreview";
import HomeResourcesPreview from "@/components/HomeResourcesPreview";
import CategoryPreview from "@/components/CategoryPreview";
import SeasonalSaleBanner from "@/components/SeasonalSaleBanner";
import { COLLECTIONS, getCollectionCoupons } from "@/lib/collections";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import { getCoupons, getStores, getUsesStats } from "@/lib/perfluence";
import { pickExpiringDeals, offerKey, isPromoHighlightEligible } from "@/lib/hotDeals";
import { buildSearchIndex } from "@/lib/searchIndex";
import { isRealPromoCode } from "@/lib/dedupe";
import { STABLE_STORES } from "@/lib/stableStores";
import { withoutForbiddenTravelCoPromotion, withoutForbiddenTanukiCoPromotion, withoutForbiddenFloristBeautyCoPromotion, withoutForbiddenGroceryCoPromotion } from "@/lib/publisherPlacementRules";

import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 900; // Обновление не реже чем раз в 15 минут; клиент дополнительно скрывает истёкшие купоны.

export default async function Home() {
  const [coupons, stores, uses] = await Promise.all([
    getCoupons(),
    getStores(),
    getUsesStats(),
  ]);

  const proofsByCode = Object.fromEntries(uses.usesByCode);
  const proofTotal = Object.values(proofsByCode).reduce((a, b) => a + b, 0);

  // Главная — короткая витрина, а не вторая копия полноценного каталога.
  // Не повторяем горящие коды и не показываем несколько карт одного магазина.
  // Publisher restrictions: Yandex Travel cannot appear with MTS Music;
  // Tanuki cannot be featured alongside FARFOR or Ёёёёёёё/Ёбидоёби.
  const curatedCoupons = withoutForbiddenGroceryCoPromotion(withoutForbiddenFloristBeautyCoPromotion(withoutForbiddenTanukiCoPromotion(withoutForbiddenTravelCoPromotion(coupons))));
  const hotDeals = pickExpiringDeals(curatedCoupons, 4);
  const excludedOffers = new Set(hotDeals.map(offerKey));
  const excludedStores = new Set(hotDeals.map((c) => c.store.slug));
  const featuredCoupons = curatedCoupons.filter((c) => isRealPromoCode(c.promocode.code) && isPromoHighlightEligible(c) && !excludedOffers.has(offerKey(c)) && !excludedStores.has(c.store.slug))
    .filter((c, index, list) => list.findIndex((item) => item.store.slug === c.store.slug) === index)
    .slice(0, 4);

  // Поиск в шапке работает на клиенте, поэтому получает лёгкий индекс, а не
  // полные объекты купонов и магазинов: иначе весь каталог уезжает в RSC-поток
  // и скачивается вместе с HTML каждым посетителем и каждым роботом.
  const searchStores = stores.some((store) => store.slug === "winlab")
    ? stores
    : [...stores, { ...STABLE_STORES.winlab, activeBloggers: STABLE_STORES.winlab.activeBloggers ?? 0 }];
  const searchIndex = buildSearchIndex(searchStores, coupons);

  const bfCol = COLLECTIONS.find((c) => c.slug === "black-friday");
  const shoppingCol = COLLECTIONS.find((c) => c.slug === "den-shopinga-11-11");
  const bfCount = bfCol ? getCollectionCoupons(bfCol, coupons).length : 73;
  const shoppingCount = shoppingCol ? getCollectionCoupons(shoppingCol, coupons).length : 18;

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: "ru-RU",
          potentialAction: {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/catalog?q={search_term_string}#catalog`,
            },
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE_NAME,
          url: SITE_URL,
          logo: `${SITE_URL}/icon.png`,
          description: "Агрегатор проверенных промокодов, скидок и акций интернет-магазинов и сервисов доставки России.",
        }}
      />

      {/* 1. Хедер с лаконичной навигацией */}
      <Header />

      <main className="min-h-screen">
        {/* 2. Hero + ЕДИНСТВЕННЫЙ крупный поиск + Trust bar */}
        <Hero search={searchIndex} couponCount={coupons.length} proofTotal={proofTotal} />

        {/* 3. Популярные магазины в стиле Пикабу — быстрый вход по круглым брендам */}
        <div className="mx-auto max-w-7xl px-4 pt-2.5 sm:pt-8">
          <Reveal>
            <PopularStores />
          </Reveal>
        </div>

        {/* Internal links to GSC-proven entry points; only stores with real active offers. */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-6">
          <PrioritySearchLinks stores={stores} />
        </div>

        {/* Короткая витрина реальных категорий. Полный каталог открыт на /category. */}
        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
          <Reveal>
            <CategoryPreview />
          </Reveal>
        </div>

        {/* Главные сезонные распродажи (11.11 и Чёрная Пятница 2026) */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-8">
          <Reveal>
            <SeasonalSaleBanner blackFridayCount={bfCount} shoppingDayCount={shoppingCount} />
          </Reveal>
        </div>

        {/* 5. Скоро заканчиваются — коды с ближайшим реальным сроком, по одному от магазина.
            Раньше здесь было два блока «Спецпредложения дня» подряд. */}
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <Reveal>
            <ExpiringDeals coupons={hotDeals} />
          </Reveal>
        </div>

        {/* Короткая подборка реальных купонов, полный каталог — на /catalog. */}
        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
          <Reveal>
            <HomeOffersPreview coupons={featuredCoupons} totalCount={coupons.length} />
          </Reveal>
        </div>

        {/* Промокоды и магазины выше рекламных анонсов. Полные оригинальные макеты и
            рекламный текст находятся только на отдельных страницах кампаний. */}
        <SberCampaignTeasers />

        {/* Подробная справка, FAQ, блог и калькулятор живут на отдельных страницах. */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11">
          <Reveal>
            <HomeResourcesPreview />
          </Reveal>
        </div>
      </main>

      {/* 13. Футер */}
      <Footer />
    </>
  );
}
