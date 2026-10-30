import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import CouponTicket from "@/components/CouponTicket";
import NewsletterBox from "@/components/NewsletterBox";
import { ACTIONS, getAction } from "@/lib/actions";
import { getCoupons } from "@/lib/perfluence";
import { COLLECTIONS, getCollectionCoupons } from "@/lib/collections";
import type { Coupon } from "@/lib/types";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = false;
export const revalidate = 900;

export async function generateStaticParams() {
  return ACTIONS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const action = getAction(slug);
  if (!action) return {};
  const pageUrl = `${SITE_URL}/akcii/${slug}`;
  return {
    title: action.title,
    description: action.description.slice(0, 160),
    alternates: { canonical: pageUrl },
    openGraph: {
      title: action.title,
      description: action.description.slice(0, 160),
      url: pageUrl,
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
    },
    twitter: {
      card: "summary_large_image",
      title: action.title,
      description: action.description.slice(0, 160),
    },
  };
}

export default async function ActionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const action = getAction(slug);
  if (!action) notFound();

  const pageUrl = `${SITE_URL}/akcii/${slug}`;
  const todayIso = new Date().toISOString();

  const allCoupons = await getCoupons();
  let sampleCoupons: Coupon[] = [];
  if (action.targetCollectionSlug) {
    const col = COLLECTIONS.find((c) => c.slug === action.targetCollectionSlug);
    if (col) {
      sampleCoupons = getCollectionCoupons(col, allCoupons).slice(0, 3);
    }
  }

  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: action.h1, item: pageUrl },
    ],
  };

  const collectionJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: action.h1,
    description: action.description,
    url: pageUrl,
    dateModified: todayIso,
  };

  const faqJsonLd: Record<string, unknown> | null =
    action.faq && action.faq.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: action.faq.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }
      : null;

  return (
    <>
      <Header />

      <main className="min-h-screen bg-paper/30 pb-16">
        <JsonLd data={breadcrumbJsonLd} />
        <JsonLd data={collectionJsonLd} />
        {faqJsonLd && <JsonLd data={faqJsonLd} />}

        <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
          <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/50">
            <Link href="/" className="hover:text-ink transition-colors">
              Главная
            </Link>
            <span className="mx-2" aria-hidden="true">
              /
            </span>
            <span aria-current="page" className="text-ink">
              {action.h1}
            </span>
          </nav>

          <header className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow px-3 py-1 text-xs font-extrabold uppercase tracking-wide text-ink shadow-2xs">
                {action.badge || "🔥 Сезонная акция"}
              </span>
              {action.period && (
                <span className="text-xs font-bold text-ink/70 bg-white border border-line rounded-full px-3 py-1">
                  Период: {action.period}
                </span>
              )}
            </div>

            <h1 className="mt-4 font-display text-2xl font-extrabold tracking-tight sm:text-4xl text-ink">
              {action.h1}
            </h1>
            <p className="mt-3 text-sm sm:text-base leading-relaxed text-ink/70">
              {action.intro}
            </p>
          </header>

          {/* Рекомендации и советы */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4">
              Как сэкономить максимум
            </h2>
            <div className="space-y-3">
              {action.body.map((para, i) => (
                <div key={i} className="flex items-start gap-3 text-sm leading-relaxed text-ink/75">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-yellow/40 text-[11px] font-bold text-ink">
                    {i + 1}
                  </span>
                  <span>{para}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Живые промокоды акции, если есть */}
          {sampleCoupons.length > 0 && (
            <section className="mt-10">
              <div className="flex items-center justify-between gap-4 mb-4">
                <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink">
                  Популярные промокоды акции
                </h2>
                {action.targetCollectionSlug && (
                  <Link
                    href={`/collections/${action.targetCollectionSlug}`}
                    className="text-xs font-bold text-red hover:underline"
                  >
                    Все предложения подборки →
                  </Link>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sampleCoupons.map((coupon) => (
                  <CouponTicket
                    key={coupon.id}
                    coupon={coupon}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Быстрый переход по категориям акции */}
          <section className="mt-10 rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink">
              Где искать скидки и промокоды
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {action.links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex items-center justify-between rounded-2xl border border-line/80 bg-paper/40 px-4 py-3.5 text-sm font-bold text-ink hover:border-red hover:text-red hover:bg-white transition-all shadow-2xs"
                >
                  <span>{l.text}</span>
                  <span className="text-red font-mono">→</span>
                </Link>
              ))}
            </div>
          </section>

          {/* FAQ Секция с микроразметкой FAQPage */}
          {action.faq && action.faq.length > 0 && (
            <section className="mt-10">
              <h2 className="font-display text-lg sm:text-xl font-extrabold text-ink mb-4">
                Частые вопросы о распродаже
              </h2>
              <div className="space-y-3">
                {action.faq.map((item, idx) => (
                  <details
                    key={idx}
                    className="group rounded-2xl border border-line bg-white p-5 transition-all open:shadow-xs"
                  >
                    <summary className="flex cursor-pointer items-center justify-between font-bold text-sm sm:text-base text-ink">
                      <span>{item.q}</span>
                      <span className="ml-4 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-paper font-mono text-xs text-ink/70 transition-transform group-open:rotate-180">
                        ↓
                      </span>
                    </summary>
                    <p className="mt-3 text-xs sm:text-sm leading-relaxed text-ink/70 border-t border-line/60 pt-3">
                      {item.a}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Подписка на рассылку акций */}
          <div className="mt-10">
            <NewsletterBox source={`akcii-${slug}`} />
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              href="/sovety"
              className="inline-block rounded-full bg-gradient-to-r from-red to-red-dark px-6 py-3 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
            >
              Все советы по экономии и гиды →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
