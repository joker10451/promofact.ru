import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import HowToApply from "@/components/HowToApply";
import JsonLd from "@/components/JsonLd";
import OtherStores from "@/components/OtherStores";
import { getStoreBySlug, getStores } from "@/lib/data";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getStores().map((store) => ({ slug: store.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const store = getStoreBySlug(slug);
  if (!store) return {};
  const pageUrl = `${SITE_URL}/store/${slug}`;
  return {
    title: `Промокод ${store.name} — актуальные скидки`,
    description: `Рабочие промокоды ${store.name}: ${store.coupons
      .map((c) => `${c.code} (${c.discount})`)
      .join(", ")}. Проверяем коды каждый день, обновляем в реальном времени.`,
    alternates: { canonical: pageUrl },
    openGraph: {
      title: `Промокод ${store.name} — актуальные скидки`,
      description: `Рабочие промокоды ${store.name}: ${store.coupons
        .map((c) => `${c.code} (${c.discount})`)
        .join(", ")}. Проверяем коды каждый день.`,
      url: pageUrl,
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
    },
  };
}

export default async function StorePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const store = getStoreBySlug(slug);
  if (!store) notFound();

  const best = store.coupons[0];
  const pageUrl = `${SITE_URL}/store/${slug}`;

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Купоны", item: `${SITE_URL}/#coupons` },
      { "@type": "ListItem", position: 3, name: store.name, item: pageUrl },
    ],
  };

  const coupons: Record<string, unknown>[] = store.coupons.map((c) => ({
    "@context": "https://schema.org",
    "@type": "Coupon",
    name: `Промокод ${c.code}: ${c.discount} в ${c.store}`,
    description: c.description,
    code: c.code,
    category: "Промокод",
    validTo: c.expires,
    url: c.affiliateUrl,
    seller: { "@type": "Organization", name: c.store },
    offers: {
      "@type": "Offer",
      url: c.affiliateUrl,
      priceCurrency: "RUB",
      price: 0,
      availability: "https://schema.org/InStock",
    },
  }));

  return (
    <main>
      <JsonLd data={breadcrumb} />
      {coupons.map((c) => (
        <JsonLd key={c.code as string} data={c} />
      ))}

      <div className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/45">
          <Link href="/" className="hover:text-ink transition-colors">
            Главная
          </Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <Link href="/#coupons" className="hover:text-ink transition-colors">
            Купоны
          </Link>
          <span className="mx-2" aria-hidden="true">/</span>
          <span aria-current="page">{store.name}</span>
        </nav>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
              Промокод {store.name} — актуальные скидки
            </h1>
            <p className="mt-3 max-w-2xl text-ink/60">
              {store.coupons.length} {store.coupons.length === 1 ? "рабочий промокод" : "рабочих промокода"}.
              {best ? ` Лучшая скидка — ${best.discount}.` : ""} Коды проверены сегодня, срок действия указан в карточке.
            </p>
          </div>
          <div className="rounded-full bg-mint/10 border border-mint/30 px-4 py-1.5 text-xs font-bold text-ink/70">
            Проверено сегодня ✓
          </div>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {store.coupons.map((coupon) => (
            <CouponTicket key={coupon.id} coupon={coupon} />
          ))}
        </div>

        <HowToApply />

        <OtherStores current={store.slug} />
      </div>
    </main>
  );
}