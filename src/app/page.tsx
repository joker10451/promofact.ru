import Link from "next/link";
import LatestTips from "@/components/LatestTips";
import PopularStores from "@/components/PopularStores";
import CouponGrid from "@/components/CouponGrid";
import ExpiringDeals from "@/components/ExpiringDeals";
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
import { getBestCoupons, getCategories, getCoupons, getStores, getUsesStats } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const revalidate = 1800;

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

export default async function Home() {
  const [coupons, best, stores, categories, uses] = await Promise.all([
    getCoupons(),
    getBestCoupons(),
    getStores(),
    getCategories(),
    getUsesStats(),
  ]);
  const featured = best[0];
  const topStores = [...stores].sort((a, b) => b.coupons.length - a.coupons.length).slice(0, 16);
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
      <main>
        <Hero featured={featured} stores={stores} coupons={coupons} />
        
        {/* Сгорающие горячие предложения дня с таймером */}
        <div className="mx-auto max-w-7xl px-4 pt-10 pb-2 sm:px-6">
          <Reveal>
            <ExpiringDeals coupons={coupons} />
          </Reveal>
        </div>

        {/* Каталог купонов */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <CouponGrid
              coupons={coupons}
              proofsByCode={proofsByCode}
              proofsByStore={proofsByStore}
            />
          </Reveal>
        </div>

        {/* Как это работает */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <HowItWorks />
          </Reveal>
        </div>

        {/* Популярные магазины */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <section>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
                  Популярные магазины
                </h2>
                <Link
                  href="/store"
                  className="text-xs sm:text-sm font-bold text-red hover:underline transition-all"
                >
                  Все магазины ({stores.length}) →
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {topStores.map((store) => (
                  <Link
                    key={store.slug}
                    href={`/store/${store.slug}`}
                    className="group flex items-center gap-3 rounded-2xl bg-white border border-line p-3 sm:p-4 transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_0_rgba(11,16,43,0.08)]"
                  >
                    {store.logo ? (
                      <img
                        src={store.logo}
                        alt={store.name}
                        width={36}
                        height={36}
                        className="h-9 w-9 shrink-0 rounded-lg border border-line bg-white object-contain p-0.5"
                      />
                    ) : (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow font-bold text-xs text-ink">
                        {store.name.slice(0, 1)}
                      </span>
                    )}
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-sm text-ink group-hover:text-red transition-colors">
                        {store.name}
                      </span>
                      <span className="block text-xs text-ink/50">
                        {store.coupons.length}{" "}
                        {store.coupons.length === 1 ? "промокод" : "промокода"}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        </div>

        {/* Категории */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <section>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold">
                Категории
              </h2>
              <div className="mt-6 flex flex-wrap gap-2.5">
                {categories.map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/category/${cat.slug}`}
                    className="rounded-full bg-white border border-line px-4 py-2 text-sm font-bold text-ink/70 hover:border-ink hover:text-ink transition-colors"
                  >
                    {cat.name} · {cat.count}
                  </Link>
                ))}
              </div>
            </section>
          </Reveal>
        </div>

        {/* SEO статья */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <SeoArticle />
          </Reveal>
        </div>

        {/* FAQ */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <Faq />
          </Reveal>
        </div>

        <Reveal>
          <LatestTips />
        </Reveal>

        {/* Партнерам и бизнесу */}
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14">
          <Reveal>
            <section aria-label="Партнёрам">
              <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
                Партнёрам и бизнесу
              </h2>
              <p className="mt-3 max-w-2xl text-ink/60">
                Проверенные сервисы, которые пригодятся, если вы ведёте своё
                дело или только думаете открыть. По партнёрским ссылкам —
                скидки на первый заказ.
              </p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Link
                  href="/partner/yookassa"
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-5 transition-transform hover:scale-[1.02]"
                >
                  <span className="text-2xl" aria-hidden="true">
                    💳
                  </span>
                  <span className="flex flex-col">
                    <span className="font-bold text-ink">
                      ЮKassa для бизнеса
                    </span>
                    <span className="text-sm text-ink/55">
                      Платежи без комиссии 90 дней
                    </span>
                  </span>
                  <span className="ml-auto text-red/60 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
                <Link
                  href="/partner/netprint"
                  className="group flex items-center gap-3 rounded-2xl border border-line bg-white p-5 transition-transform hover:scale-[1.02]"
                >
                  <span className="text-2xl" aria-hidden="true">
                    🖼️
                  </span>
                  <span className="flex flex-col">
                    <span className="font-bold text-ink">
                      Net Print: интерьерная печать
                    </span>
                    <span className="text-sm text-ink/55">
                      Скидка 30% на первый заказ
                    </span>
                  </span>
                  <span className="ml-auto text-red/60 transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </div>
            </section>
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

