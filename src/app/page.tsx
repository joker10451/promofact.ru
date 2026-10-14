import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PopularStores from "@/components/PopularStores";
import ExpiringDeals from "@/components/ExpiringDeals";
import SberCampaignTeasers from "@/components/SberCampaignTeasers";
import HomeOffersPreview from "@/components/HomeOffersPreview";
import HomeResourcesPreview from "@/components/HomeResourcesPreview";
import CategoryPreview from "@/components/CategoryPreview";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import { getCoupons, getStores, getUsesStats } from "@/lib/perfluence";
import { pickExpiringDeals, offerKey } from "@/lib/hotDeals";
import { buildSearchIndex } from "@/lib/searchIndex";
import { isRealPromoCode } from "@/lib/dedupe";
import { STABLE_STORES } from "@/lib/stableStores";

import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = false; // 12 часов — защита лимита ISR Writes на Vercel

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
  const hotDeals = pickExpiringDeals(coupons, 4);
  const excludedOffers = new Set(hotDeals.map(offerKey));
  const excludedStores = new Set(hotDeals.map((c) => c.store.slug));
  const featuredCoupons = coupons.filter((c) => isRealPromoCode(c.promocode.code) && !excludedOffers.has(offerKey(c)) && !excludedStores.has(c.store.slug))
    .filter((c, index, list) => list.findIndex((item) => item.store.slug === c.store.slug) === index)
    .slice(0, 4);

  // Поиск в шапке работает на клиенте, поэтому получает лёгкий индекс, а не
  // полные объекты купонов и магазинов: иначе весь каталог уезжает в RSC-поток
  // и скачивается вместе с HTML каждым посетителем и каждым роботом.
  const searchStores = stores.some((store) => store.slug === "winlab")
    ? stores
    : [...stores, { ...STABLE_STORES.winlab, activeBloggers: STABLE_STORES.winlab.activeBloggers ?? 0 }];
  const searchIndex = buildSearchIndex(searchStores, coupons);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE_NAME,
          url: SITE_URL,
          inLanguage: "ru-RU",
        }}
      />

      {/* 1. Хедер с лаконичной навигацией */}
      <Header />

      <main className="min-h-screen">
        {/* 2. Hero + ЕДИНСТВЕННЫЙ крупный поиск + Trust bar */}
        <Hero search={searchIndex} couponCount={coupons.length} proofTotal={proofTotal} />

        {/* Главная ценность сервиса: реальные промокоды сразу после поиска. */}
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-6 sm:py-10">
          <Reveal>
            <HomeOffersPreview coupons={featuredCoupons} totalCount={coupons.length} />
          </Reveal>
        </div>

        {/* Быстрый доступ к магазинам и категориям после подборки кодов. */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:pt-8">
          <Reveal>
            <PopularStores />
          </Reveal>
        </div>

        <div className="mx-auto max-w-7xl px-4 pt-5 sm:px-6 sm:pt-8">
          <Reveal>
            <CategoryPreview />
          </Reveal>
        </div>

        {/* Срочные предложения сохраняются отдельно от редакционной подборки. */}
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <Reveal>
            <ExpiringDeals coupons={hotDeals} />
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
