import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/JsonLd";
import { ARTICLES, getArticle } from "@/lib/articles";
import { SITE_NAME, SITE_URL, CHANNELS } from "@/lib/site";

export const revalidate = 1800;

export async function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  const url = `${SITE_URL}/sovety/${slug}`;
  return {
    title: article.title,
    description: article.description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description: article.description,
      url,
      type: "article",
      locale: "ru_RU",
      siteName: SITE_NAME,
    },
  };
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();

  const moreArticles = ARTICLES.filter((a) => a.slug !== slug).slice(0, 3);

  const url = `${SITE_URL}/sovety/${slug}`;
  const articleJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.description,
    datePublished: new Date().toISOString(),
    dateModified: new Date().toISOString(),
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Советы", item: `${SITE_URL}/sovety` },
      {
        "@type": "ListItem",
        position: 3,
        name: article.title,
        item: url,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <nav
        aria-label="Хлебные крошки"
        className="text-xs font-semibold text-ink/45"
      >
        <Link href="/" className="hover:text-ink transition-colors">
          Главная
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <Link href="/sovety" className="hover:text-ink transition-colors">
          Советы
        </Link>
        <span className="mx-2" aria-hidden="true">
          /
        </span>
        <span aria-current="page">{article.title}</span>
      </nav>

      <h1 className="mt-6 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
        {article.title}
      </h1>
      <p className="mt-3 text-ink/60">{article.description}</p>

      <article className="mt-8 space-y-4">
        {article.body.map((p, i) => (
          <p key={i} className="leading-relaxed text-ink/70">
            {p}
          </p>
        ))}
      </article>

      {article.related.length > 0 && (
        <section className="mt-10 rounded-2xl border border-line bg-white p-6">
          <h2 className="font-display text-lg font-extrabold">
            Полезные ссылки
          </h2>
          <ul className="mt-4 space-y-2">
            {article.related.map((r) => (
              <li key={r.href}>
                <Link
                  href={r.href}
                  className="font-semibold text-ink underline underline-offset-2 hover:text-red transition-colors"
                >
                  {r.text}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-extrabold">
          Читайте также
        </h2>
        <ul className="mt-4 space-y-3">
          {moreArticles.map((a) => (
            <li key={a.slug}>
              <Link
                href={`/sovety/${a.slug}`}
                className="font-semibold text-ink underline underline-offset-2 hover:text-red transition-colors"
              >
                {a.title}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-mint/30 bg-mint/10 p-6">
        <h2 className="font-display text-lg font-extrabold">
          Подпишитесь на выгодные новости
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          Свежие промокоды и лайфхаки экономии — в наших каналах.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={CHANNELS.telegram}
            target="_blank"
            rel="noopener nofollow"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
          >
            Telegram
          </a>
          <a
            href={CHANNELS.youtube}
            target="_blank"
            rel="noopener nofollow"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
          >
            YouTube
          </a>
          <a
            href={CHANNELS.dzen}
            target="_blank"
            rel="noopener nofollow"
            className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
          >
            Дзен
          </a>
        </div>
      </section>

      <div className="mt-10">
        <Link
          href="/sovety"
          className="text-sm font-bold text-ink/70 hover:text-ink transition-colors"
        >
          ← Все советы
        </Link>
      </div>
    </main>
  );
}
