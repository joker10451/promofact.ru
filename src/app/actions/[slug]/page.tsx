import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { ACTIONS, getAction } from "@/lib/actions";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const dynamicParams = true;
export const revalidate = 1800;

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
  const pageUrl = `${SITE_URL}/actions/${slug}`;
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

  const pageUrl = `${SITE_URL}/actions/${slug}`;
  const todayIso = new Date().toISOString();

  const breadcrumb: Record<string, unknown> = {
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

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={breadcrumb} />
      <JsonLd data={collectionJsonLd} />

      <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-ink/60">
        <Link href="/" className="hover:text-ink">
          Главная
        </Link>
        <span className="mx-2">/</span>
        <span aria-current="page" className="text-ink">
          {action.h1}
        </span>
      </nav>

      <h1 className="font-display text-2xl font-extrabold sm:text-3xl">
        {action.h1}
      </h1>
      <p className="mt-3 leading-relaxed text-ink/70">{action.intro}</p>

      <section className="mt-8 space-y-3">
        {action.body.map((para, i) => (
          <p key={i} className="leading-relaxed text-ink/70">
            {para}
          </p>
        ))}
      </section>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-extrabold">
          Куда перейти за скидками
        </h2>
        <ul className="mt-4 space-y-2">
          {action.links.map((l) => (
            <li key={l.href}>
              <Link
                href={l.href}
                className="text-red hover:underline font-medium"
              >
                {l.text} →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <Link
          href="/sovety"
          className="inline-block rounded-full bg-gradient-to-r from-red to-red-dark px-5 py-2.5 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
        >
          Все советы по экономии →
        </Link>
      </div>
    </main>
  );
}

