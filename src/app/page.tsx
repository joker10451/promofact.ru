import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PopularStores from "@/components/PopularStores";
import ExpiringDeals from "@/components/ExpiringDeals";
import TeamBanner from "@/components/TeamBanner";
import SberCampaignTeasers from "@/components/SberCampaignTeasers";
import CouponGrid from "@/components/CouponGrid";
import SavingsCalculator from "@/components/SavingsCalculator";
import HowItWorks from "@/components/HowItWorks";
import VisualCategoryTiles from "@/components/VisualCategoryTiles";
import WhyUs from "@/components/WhyUs";
import Faq from "@/components/Faq";
import LatestTips from "@/components/LatestTips";
import SeoArticle from "@/components/SeoArticle";
import Subscribe from "@/components/Subscribe";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import { getCoupons, getStores, getUsesStats } from "@/lib/perfluence";
import { pickExpiringDeals, offerKey } from "@/lib/hotDeals";
import { buildSearchIndex } from "@/lib/searchIndex";
import { toCatalogCoupon } from "@/lib/catalogCoupon";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = false; // 12 часов — защита лимита ISR Writes на Vercel

const FAQ_JSONLD = [
  {
    "@type": "Question",
    name: "Промокоды на сайте правда работают?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Мы собираем промокоды из партнёрских программ магазинов и показываем только те, у которых не истёк срок действия. Условия у каждой акции свои — они указаны в карточке. Если код не сработал, проверьте минимальную сумму заказа и не действует ли акция только для новых покупателей.",
    },
  },
  {
    "@type": "Question",
    name: "Как применить промокод в интернет-магазине?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Скопируйте код кнопкой «Скопировать», перейдите в магазин по нашей ссылке и вставьте код в поле «Промокод» при оформлении корзины.",
    },
  },
  {
    "@type": "Question",
    name: "Почему промокод не работает?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Купон мог истечь, подходить только для новых клиентов или не суммироваться с распродажей. Условия указаны в карточке купона.",
    },
  },
  {
    "@type": "Question",
    name: "Сколько стоят промокоды?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Всё бесплатно. Мы зарабатываем на партнёрских комиссиях магазинов, на вашу скидку это не влияет.",
    },
  },
];

export default async function Home() {
  const [coupons, stores, uses] = await Promise.all([
    getCoupons(),
    getStores(),
    getUsesStats(),
  ]);

  const proofsByCode = Object.fromEntries(uses.usesByCode);
  const proofsByStore = Object.fromEntries(uses.usesByStore);
  const proofTotal = Object.values(proofsByCode).reduce((a, b) => a + b, 0);

  // Купоны из блока «Спецпредложения дня» исключаем из ленты каталога ниже,
  // чтобы топ-3 не повторялись первыми тремя карточками. Ключ «магазин + код»,
  // а не id: убирает и дубли того же оффера с другим id (разные источники).
  const hotDeals = pickExpiringDeals(coupons, 4);
  const hotDealKeys = hotDeals.map(offerKey);

  // Поиск в шапке работает на клиенте, поэтому получает лёгкий индекс, а не
  // полные объекты купонов и магазинов: иначе весь каталог уезжает в RSC-поток
  // и скачивается вместе с HTML каждым посетителем и каждым роботом.
  const searchIndex = buildSearchIndex(stores, coupons);

  // Каталог тоже клиентский: отдаём ему купоны без полей, которых он не
  // показывает. Объект магазина повторяется в каждом купоне, поэтому описания
  // и условия дублировались столько раз, сколько у магазина промокодов.
  const catalogCoupons = coupons.map(toCatalogCoupon);

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_JSONLD,
        }}
      />
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
      <div className="pf-v3">
      <Header />

      <main className="min-h-screen bg-paper">
        {/* 2. Hero + ЕДИНСТВЕННЫЙ крупный поиск + Trust bar */}
        <Hero search={searchIndex} couponCount={coupons.length} proofTotal={proofTotal} />

        {/* 3. Популярные магазины в стиле Пикабу — быстрый вход по круглым брендам */}
        <div className="mx-auto max-w-7xl px-4 pt-4 sm:px-6 sm:pt-7">
          <Reveal>
            <PopularStores />
          </Reveal>
        </div>

        {/* 5. Скоро заканчиваются — коды с ближайшим реальным сроком, по одному от магазина.
            Раньше здесь было два блока «Спецпредложения дня» подряд. */}
        <div className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 sm:pt-9">
          <Reveal>
            <ExpiringDeals coupons={hotDeals} />
          </Reveal>
        </div>

        {/* 7. Купоны на сегодня — сгруппированный каталог (лучший промокод + аккордеон) */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <Reveal>
            <CouponGrid
              coupons={catalogCoupons}
              proofsByCode={proofsByCode}
              proofsByStore={proofsByStore}
              excludeOfferKeys={hotDealKeys}
            />
          </Reveal>
        </div>

        {/* Промокоды и магазины выше рекламных анонсов. Полные оригинальные макеты и
            рекламный текст находятся только на отдельных страницах кампаний. */}
        <SberCampaignTeasers />

        {/* 8. Скидки по категориям — быстрый переход */}
        <Reveal>
          <VisualCategoryTiles />
        </Reveal>

        {/* 10. FAQ — частые вопросы */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <Faq />
          </Reveal>
        </div>

        {/* 11. База знаний и полезные советы */}
        <Reveal>
          <LatestTips />
        </Reveal>

        {/* Secondary learning tools remain accessible, but no longer push live offers
            several screens down or compete with the catalog visually. */}
        <details className="pf3-muted-block mx-auto mt-8 max-w-7xl rounded-2xl px-4 sm:px-6">
          <summary className="cursor-pointer list-none rounded-2xl border border-line bg-white px-5 py-4 text-sm font-bold text-ink transition-colors hover:border-red/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red">
            Как пользоваться промокодами и экономить <span aria-hidden="true" className="float-right text-red">＋</span>
          </summary>
          <div className="space-y-6 py-6">
            <Reveal><TeamBanner /></Reveal>
            <Reveal><HowItWorks /></Reveal>
            <Reveal><SavingsCalculator /></Reveal>
            <Reveal><WhyUs /></Reveal>
          </div>
        </details>

        {/* 12. SEO-статья под спойлером */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <SeoArticle />
          </Reveal>
        </div>

        {/* 13. Подписка на Telegram */}
        <Reveal>
          <Subscribe />
        </Reveal>
      </main>

      {/* 13. Футер */}
      <Footer />
      </div>
    </>
  );
}
