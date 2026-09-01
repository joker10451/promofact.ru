import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HotDeals from "@/components/HotDeals";
import PopularStores from "@/components/PopularStores";
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
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 1800;

const FAQ_JSONLD = [
  {
    "@type": "Question",
    name: "Промокоды на сайте правда работают?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Да. Мы вручную и автоматически проверяем каждый промокод раз в 1–2 дня и сразу убираем те, что перестали срабатывать.",
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
        <Hero stores={stores} coupons={coupons} />

        {/* 3. 🔥 Горит сегодня — Топ-3 супер-скидки с FOMO-таймером */}
        <Reveal>
          <HotDeals coupons={coupons} />
        </Reveal>

        {/* 4. Популярные магазины — быстрый вход по брендам перед каталогом */}
        <Reveal>
          <PopularStores />
        </Reveal>

        {/* 5. Купоны на сегодня — сгруппированный каталог (лучший промокод + аккордеон) */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <Reveal>
            <CouponGrid
              coupons={coupons}
              proofsByCode={proofsByCode}
              proofsByStore={proofsByStore}
            />
          </Reveal>
        </div>

        {/* 6. Как это работает — 4 понятных шага применения */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
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
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10">
          <Reveal>
            <Faq />
          </Reveal>
        </div>

        {/* 11. База знаний и полезные советы */}
        <Reveal>
          <LatestTips />
        </Reveal>

        {/* 12. SEO-статья под спойлером */}
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
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
