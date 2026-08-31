import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HotDeals from "@/components/HotDeals";
import CouponGrid from "@/components/CouponGrid";
import PopularStores from "@/components/PopularStores";
import SavingsCalculator from "@/components/SavingsCalculator";
import VisualCategoryTiles from "@/components/VisualCategoryTiles";
import WhyUs from "@/components/WhyUs";
import Faq from "@/components/Faq";
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
      text: "Скопируйте код кнопкой «Копировать», перейдите в магазин по нашей ссылке и вставьте код в поле «Промокод» при оформлении корзины.",
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

      <Header />

      <main className="min-h-screen">
        {/* 1. Hero с массивным поиском и trust-метриками */}
        <Hero stores={stores} coupons={coupons} />

        {/* 2. 🔥 Горит сегодня — Топ-3 супер-скидки */}
        <Reveal>
          <HotDeals coupons={coupons} />
        </Reveal>

        {/* 3. Основной каталог купонов (2 колонки, смарт-чипы, фильтры) */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-16">
          <Reveal>
            <CouponGrid
              coupons={coupons}
              proofsByCode={proofsByCode}
              proofsByStore={proofsByStore}
            />
          </Reveal>
        </div>

        {/* 4. Популярные магазины (брендовые плитки) */}
        <Reveal>
          <PopularStores />
        </Reveal>

        {/* 5. Интерактивный калькулятор выгоды */}
        <Reveal>
          <SavingsCalculator />
        </Reveal>

        {/* 6. Категории скидок (плитки с эмодзи) */}
        <Reveal>
          <VisualCategoryTiles />
        </Reveal>

        {/* 7. Почему ПромоФакт? (УТП и доверие) */}
        <Reveal>
          <WhyUs />
        </Reveal>

        {/* 8. Частые вопросы (FAQ Accordion) */}
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
          <Reveal>
            <Faq />
          </Reveal>
        </div>

        {/* 9. SEO-статья (под аккуратным спойлером) */}
        <Reveal>
          <SeoArticle />
        </Reveal>

        {/* 10. Newsletter (Подписка на еженедельные лучшие скидки) */}
        <Reveal>
          <Subscribe />
        </Reveal>
      </main>

      <Footer />
    </>
  );
}
