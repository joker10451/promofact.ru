import CouponGrid from "@/components/CouponGrid";
import CpaBlock from "@/components/CpaBlock";
import Faq from "@/components/Faq";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import JsonLd from "@/components/JsonLd";
import Reveal from "@/components/Reveal";
import SeoArticle from "@/components/SeoArticle";
import StoresMarquee from "@/components/StoresMarquee";
import Subscribe from "@/components/Subscribe";
import Ticker from "@/components/Ticker";
import { coupons } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/site";

const FAQ_JSONLD = [
  {
    "@type": "Question",
    name: "Промокоды на сайте правда работают?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Да. Мы вручную проверяем каждый промокод раз в 1–2 дня и сразу убираем те, что перестали срабатывать.",
    },
  },
  {
    "@type": "Question",
    name: "Как применить промокод в интернет-магазине?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Скопируй код кнопкой «Копировать», перейди в магазин по нашей ссылке и вставь код в поле «Промокод» на этапе оплаты.",
    },
  },
  {
    "@type": "Question",
    name: "Почему промокод не работает?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Купон мог истечь, подходить только для новых клиентов или не суммироваться с распродажей. Условия указаны в описании купона.",
    },
  },
  {
    "@type": "Question",
    name: "Сколько стоят промокоды?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Всё бесплатно. Мы зарабатываем на партнёрских CPA-ссылках: магазин платит нам комиссию за заказ, на твою скидку это не влияет.",
    },
  },
  {
    "@type": "Question",
    name: "Как часто обновляются купоны?",
    acceptedAnswer: {
      "@type": "Answer",
      text: "Каждый день. Новые промокоды появляются по мере выхода акций, а истёкшие удаляются автоматически.",
    },
  },
];

export default function Home() {
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

      <Ticker />
      <Header />
      <main>
        <Hero />
        <StoresMarquee />
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <CouponGrid coupons={coupons} />
          </Reveal>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <HowItWorks />
          </Reveal>
        </div>
        <Reveal>
          <CpaBlock />
        </Reveal>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <SeoArticle />
          </Reveal>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <Faq />
          </Reveal>
        </div>
        <Reveal>
          <Subscribe />
        </Reveal>
      </main>
      <Footer />
    </>
  );
}
