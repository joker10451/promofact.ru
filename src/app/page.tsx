import Header from "@/components/Header";
import Hero from "@/components/Hero";
import PopularStores from "@/components/PopularStores";
import ExpiringDeals from "@/components/ExpiringDeals";
import TeamBanner from "@/components/TeamBanner";
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
import PromoBanner from "@/components/PromoBanner";
import { getActivePromoBanners } from "@/lib/promoBanners";
import { getCoupons, getStores, getUsesStats } from "@/lib/perfluence";
import { pickExpiringDeals, offerKey } from "@/lib/hotDeals";
import { buildSearchIndex } from "@/lib/searchIndex";
import { toCatalogCoupon } from "@/lib/catalogCoupon";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 43200; // 12 часов — защита лимита ISR Writes на Vercel

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
          potentialAction: {
            "@type": "SearchAction",
            target: `${SITE_URL}/?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        }}
      />

      {/* 1. Хедер с лаконичной навигацией */}
      <Header />

      <main className="min-h-screen">
        {/* 2. Hero + ЕДИНСТВЕННЫЙ крупный поиск + Trust bar */}
        <Hero search={searchIndex} couponCount={coupons.length} proofTotal={proofTotal} />

        {/* 3. Популярные магазины в стиле Пикабу — быстрый вход по круглым брендам */}
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <Reveal>
            <PopularStores />
          </Reveal>
        </div>

        {/* 4. Эксклюзивный баннер от команды (в стиле Пикабу) */}
        <div className="pt-6">
          <Reveal>
            <TeamBanner />
          </Reveal>
        </div>

        {/* 5. Скоро заканчиваются — коды с ближайшим реальным сроком, по одному от магазина.
            Раньше здесь было два блока «Спецпредложения дня» подряд. */}
        <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
          <Reveal>
            <ExpiringDeals coupons={hotDeals} />
          </Reveal>
        </div>

        {getActivePromoBanners().map((banner) => (
          <div key={banner.id} className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
            <PromoBanner banner={banner} />
          </div>
        ))}

        {/* 7. Купоны на сегодня — сгруппированный каталог (лучший промокод + аккордеон) */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <CouponGrid
              coupons={catalogCoupons}
              proofsByCode={proofsByCode}
              proofsByStore={proofsByStore}
              excludeOfferKeys={hotDealKeys}
            />
          </Reveal>
        </div>

        {/* 6. Как это работает — 4 понятных шага применения */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <HowItWorks />
          </Reveal>
        </div>

        {/* 7. 💰 Калькулятор выгоды */}
        <Reveal>
          <SavingsCalculator />
        </Reveal>

        {/* 8. Скидки по категориям — быстрый переход */}
        <Reveal>
          <VisualCategoryTiles />
        </Reveal>

        {/* 9. Почему ПромоФакт? — гарантия и прозрачность */}
        <Reveal>
          <WhyUs />
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
    </>
  );
}
