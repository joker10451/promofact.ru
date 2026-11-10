import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import CouponTicket from "@/components/CouponTicket";
import { getCoupons } from "@/lib/perfluence";
import { toCatalogCoupon } from "@/lib/catalogCoupon";
import { ACTIONS, isActionExpired } from "@/lib/actions";
import { plural } from "@/lib/format";
import { SITE_NAME, SITE_URL } from "@/lib/site";
import { MIN_TODAY_OFFERS, currentTime, moscowDay, selectTodayOffers, todayOfferCount } from "@/lib/todayOffers";

// One URL, rebuilt every hour: the date in the title and the list follow the Moscow calendar.
export const revalidate = 3600;

const PATH = "/promokody/segodnya";

const FAQ = [
  {
    q: "Как часто обновляется эта страница?",
    a: "Каждый час страница собирается заново, а предложения партнёров обновляются несколько раз в сутки. Срок действия сверяется с московским временем: предложение пропадает после последнего дня акции.",
  },
  {
    q: "Что значит «заканчивается сегодня»?",
    a: "Партнёр указал последним днём действия сегодняшнюю дату по Москве. Завтра такого предложения в списке уже не будет.",
  },
  {
    q: "Почему промокод может не сработать?",
    a: "Магазин сам решает, кому и на каких условиях подходит код: минимальная сумма заказа, только первый заказ, регион, лимит применений. Условия указаны в карточке. Мы не видим вашу корзину и не можем проверить, примет ли магазин код.",
  },
];

export async function generateMetadata(): Promise<Metadata> {
  const now = currentTime();
  const day = moscowDay(now);
  const offers = selectTodayOffers(await getCoupons(), now);
  const n = todayOfferCount(offers);
  const title = `Промокоды на сегодня, ${day.label}: ${n} ${plural(n, "предложение", "предложения", "предложений")}`;
  const description = `Действующие на ${day.label} промокоды и скидки: срок не истёк, самые выгодные сверху. Список обновляется автоматически.`;
  const url = `${SITE_URL}${PATH}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    // Too few offers would be a thin page: keep it out of the index until there are enough.
    robots: { index: n >= MIN_TODAY_OFFERS, follow: true },
    openGraph: {
      title: `${title} — ${SITE_NAME}`,
      description,
      url,
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
    },
  };
}

export default async function TodayPromoPage() {
  const now = currentTime();
  const day = moscowDay(now);
  const offers = selectTodayOffers(await getCoupons(), now);
  const total = todayOfferCount(offers);
  const sales = ACTIONS.filter((a) => !isActionExpired(a, now));
  const pageUrl = `${SITE_URL}${PATH}`;

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Промокоды на сегодня", item: pageUrl },
    ],
  };
  const faq = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
  const list = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: [...offers.endingToday, ...offers.best].map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${c.store.name}: ${c.promocode.bonusName || "предложение"}`.slice(0, 110),
      url: `${SITE_URL}/store/${c.store.slug}`,
    })),
  };

  return (
    <>
      <Header />
      <main className="min-h-screen">
        <JsonLd data={breadcrumb} />
        <JsonLd data={faq} />
        {total > 0 && <JsonLd data={list} />}

        <div className="border-b border-line bg-white/80">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-11">
            <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/55">
              <Link href="/" className="hover:text-red">Главная</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span aria-current="page" className="text-ink">Промокоды на сегодня</span>
            </nav>
            <h1 className="mt-5 max-w-3xl font-display text-2xl font-extrabold text-ink sm:text-4xl">
              Промокоды на сегодня, {day.label}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">
              На {day.short} в каталоге {offers.activeCount}{" "}
              {plural(offers.activeCount, "действующее предложение", "действующих предложения", "действующих предложений")}{" "}
              от {offers.storeCount} {plural(offers.storeCount, "магазина", "магазинов", "магазинов")}. Ниже по одному
              лучшему предложению каждого магазина. Мы показываем только те, у которых срок ещё не истёк по московскому времени.
            </p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 sm:py-12">
          {total === 0 ? (
            <p className="rounded-2xl border border-line bg-white p-6 text-sm text-ink/70">
              Сейчас нет предложений со сроком действия на сегодня.{" "}
              <Link href="/catalog" className="font-bold text-red hover:underline">Открыть весь каталог →</Link>
            </p>
          ) : (
            <>
              {offers.endingToday.length > 0 && (
                <section aria-labelledby="ending-today" className="mb-12">
                  <h2 id="ending-today" className="font-display text-xl font-extrabold text-ink sm:text-2xl">
                    Заканчиваются сегодня
                  </h2>
                  <p className="mt-1 text-sm text-ink/60">Последний день действия — {day.short}.</p>
                  <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {offers.endingToday.map((c) => (
                      <CouponTicket key={c.id} coupon={toCatalogCoupon(c)} placement="today_coupon" />
                    ))}
                  </div>
                </section>
              )}

              {offers.best.length > 0 && (
                <section aria-labelledby="best-today">
                  <h2 id="best-today" className="font-display text-xl font-extrabold text-ink sm:text-2xl">
                    Лучшие предложения дня
                  </h2>
                  <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {offers.best.map((c) => (
                      <CouponTicket key={c.id} coupon={toCatalogCoupon(c)} placement="today_coupon" />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}

          <nav aria-label="Другие подборки" className="mt-12 flex flex-wrap gap-x-5 gap-y-2 text-sm font-bold">
            <Link href="/catalog" className="text-red hover:underline">Весь каталог →</Link>
            <Link href="/category" className="text-red hover:underline">Категории скидок →</Link>
            {sales.map((a) => (
              <Link key={a.slug} href={`/akcii/${a.slug}`} className="text-red hover:underline">
                {a.h1} →
              </Link>
            ))}
          </nav>

          <section aria-labelledby="faq" className="mt-14 max-w-3xl">
            <h2 id="faq" className="font-display text-xl font-extrabold text-ink sm:text-2xl">Частые вопросы</h2>
            <dl className="mt-5 space-y-5">
              {FAQ.map((f) => (
                <div key={f.q}>
                  <dt className="font-bold text-ink">{f.q}</dt>
                  <dd className="mt-1 text-sm leading-relaxed text-ink/70">{f.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
