import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import CouponTicket from "@/components/CouponTicket";
import JsonLd from "@/components/JsonLd";
import { getStores, getUsesStats } from "@/lib/perfluence";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 1800;

export async function generateStaticParams() {
  try {
    const stores = await getStores();
    const out: { slug: string; code: string }[] = [];
    for (const s of stores) {
      for (const c of s.coupons) {
        if (c.promocode.code) out.push({ slug: s.slug, code: c.promocode.code });
      }
    }
    if (out.length > 0) return out;
  } catch {
    /* ignore */
  }
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}): Promise<Metadata> {
  const { slug, code } = await params;
  const stores = await getStores();
  const store = stores.find((s) => s.slug === slug);
  if (!store) return {};
  const coupon = store.coupons.find((c) => c.promocode.code === code);
  if (!coupon) return {};
  const p = coupon.promocode;
  const offer = p.bonusName || `скидка по промокоду ${code}`;
  const title = `Промокод ${code} — ${store.name}: ${offer}`;
  const description = `Промокод ${code} для ${store.name}: ${offer}.${p.terms ? " " + p.terms : ""} Копируй и применяй при оплате.`;
  const pageUrl = `${SITE_URL}/store/${slug}/${code}`;
  return {
    title,
    description: description.slice(0, 160),
    alternates: { canonical: pageUrl },
    openGraph: {
      title,
      description: description.slice(0, 160),
      url: pageUrl,
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
      images: store.logo ? [{ url: store.logo, alt: store.name }] : undefined,
    },
    twitter: {
      card: store.logo ? "summary_large_image" : "summary",
      title,
      description: description.slice(0, 160),
      images: store.logo ? [store.logo] : undefined,
    },
  };
}

export default async function CouponPage({
  params,
}: {
  params: Promise<{ slug: string; code: string }>;
}) {
  const { slug, code } = await params;
  const [stores, uses] = await Promise.all([getStores(), getUsesStats()]);
  const store = stores.find((s) => s.slug === slug);
  if (!store) notFound();
  const coupon = store.coupons.find((c) => c.promocode.code === code);
  if (!coupon) notFound();

  const p = coupon.promocode;
  const pageUrl = `${SITE_URL}/store/${slug}/${code}`;
  const storeUrl = `${SITE_URL}/store/${slug}`;
  const storeProofCount = uses.usesByStore.get(store.id) ?? 0;
  const todayIso = new Date().toISOString();

  const breadcrumb: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: store.category,
        item: `${SITE_URL}/category/${store.categorySlug}`,
      },
      { "@type": "ListItem", position: 3, name: store.name, item: storeUrl },
      { "@type": "ListItem", position: 4, name: `Промокод ${code}`, item: pageUrl },
    ],
  };

  const couponJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Coupon",
    name: p.bonusName || `Промокод ${code}`,
    description: p.bonusName || store.name,
    discountCode: code,
    category: "Промокод",
    validThrough: p.expires,
    dateModified: todayIso,
    url: coupon.affiliate.link || store.site,
    seller: { "@type": "Organization", name: store.name },
    offers: {
      "@type": "Offer",
      url: coupon.affiliate.link || store.site,
      priceCurrency: "RUB",
      price: 0,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={breadcrumb} />
      <JsonLd data={couponJsonLd} />

      <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-ink/60">
        <Link href="/" className="hover:text-ink">
          Главная
        </Link>
        <span className="mx-2">/</span>
        <Link href={`/category/${store.categorySlug}`} className="hover:text-ink">
          {store.category}
        </Link>
        <span className="mx-2">/</span>
        <Link href={storeUrl} className="hover:text-ink">
          {store.name}
        </Link>
        <span className="mx-2">/</span>
        <span aria-current="page" className="text-ink">
          Промокод {code}
        </span>
      </nav>

      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
        Промокод {code} — {store.name}
      </h1>
      {p.bonusName && (
        <p className="mt-2 text-lg text-ink/80">{p.bonusName}</p>
      )}

      <div className="mt-6">
        <CouponTicket coupon={coupon} storeProofCount={storeProofCount} />
      </div>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-extrabold">Условия и как применить</h2>
        {p.terms && <p className="mt-3 leading-relaxed text-ink/70">{p.terms}</p>}
        {p.region && (
          <p className="mt-2 leading-relaxed text-ink/70">Регион: {p.region}</p>
        )}
        {p.expires && (
          <p className="mt-2 leading-relaxed text-ink/70">
            Действует до {new Date(p.expires).toLocaleDateString("ru-RU")}.
          </p>
        )}
        <ol className="mt-4 list-decimal space-y-2 pl-5 leading-relaxed text-ink/70">
          <li>Скопируйте промокод {code} кнопкой выше.</li>
          <li>
            Перейдите в магазин {store.name} по нашей партнёрской ссылке.
          </li>
          <li>Вставьте код в поле «Промокод» на этапе оплаты.</li>
          <li>Скидка применится сразу — её видно до подтверждения заказа.</li>
        </ol>
      </section>

      <div className="mt-8">
        <Link
          href={storeUrl}
          className="inline-block rounded-full bg-gradient-to-r from-red to-red-dark px-5 py-2.5 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
        >
          Все промокоды {store.name} →
        </Link>
      </div>
    </main>
  );
}

