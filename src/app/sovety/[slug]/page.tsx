import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import YandexAdBlock from "@/components/YandexAdBlock";
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
    <>
      <Header />

      <main className="min-h-screen bg-paper/30 py-10 sm:py-14 border-b border-line">
        <JsonLd data={articleJsonLd} />
        <JsonLd data={breadcrumbJsonLd} />

        <div className="mx-auto max-w-3xl px-4 sm:px-6">
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
            <span aria-current="page" className="text-ink truncate max-w-[200px] inline-block align-bottom">
              {article.title}
            </span>
          </nav>

          <article className="mt-6 rounded-3xl border border-line bg-white p-6 sm:p-10 shadow-xs">
            <div className="flex items-center gap-2 text-[11px] font-bold text-ink/40 mb-3">
              <span className="uppercase tracking-wider">Гайд по экономии</span>
              <span>•</span>
              <span>⏱ 3–4 мин чтения</span>
              <span>•</span>
              <span className="text-mint-dark">✓ Проверено</span>
            </div>

            <h1 className="font-display text-2xl sm:text-4xl font-extrabold leading-tight text-ink">
              {article.title}
            </h1>
            <p className="mt-4 text-base sm:text-lg leading-relaxed text-ink/70 font-medium pb-6 border-b border-line">
              {article.description}
            </p>

            <div className="mt-6 space-y-4 text-base leading-relaxed text-ink/80">
              {article.body.map((p, i) => (
                <p key={i} className="leading-relaxed">
                  {p}
                </p>
              ))}
            </div>

            {/* Внутренние ссылки на промокоды */}
            {article.related.length > 0 && (
              <div className="mt-8 rounded-2xl bg-yellow/15 border border-yellow/50 p-5">
                <div className="font-display text-sm font-bold text-ink mb-3 flex items-center gap-2">
                  <span>🏷</span>
                  <span>Скидки и промокоды по теме:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {article.related.map((r) => (
                    <Link
                      key={r.href}
                      href={r.href}
                      className="inline-flex items-center gap-1 rounded-xl bg-white border border-line px-3.5 py-2 text-xs font-bold text-ink shadow-2xs hover:border-red hover:text-red transition-all"
                    >
                      <span>{r.text}</span>
                      <span>→</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </article>

          {/* Читайте также */}
          <section className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-8 shadow-xs">
            <h2 className="font-display text-lg font-extrabold text-ink mb-4">
              Другие полезные гиды
            </h2>
            <div className="grid gap-3">
              {moreArticles.map((a) => (
                <Link
                  key={a.slug}
                  href={`/sovety/${a.slug}`}
                  className="group flex items-center justify-between rounded-xl border border-line/60 bg-paper/40 p-4 transition-all hover:bg-white hover:border-ink/20 hover:shadow-2xs"
                >
                  <span className="font-display text-sm font-bold text-ink group-hover:text-red transition-colors">
                    {a.title}
                  </span>
                  <span className="text-xs font-bold text-red shrink-0 ml-3">
                    Читать →
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* Соцсети */}
          <section className="mt-6 rounded-3xl border border-mint/30 bg-mint/10 p-6 text-center sm:text-left sm:flex sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-ink">
                Свежие промокоды в Telegram
              </h2>
              <p className="mt-1 text-xs text-ink/60">
                Публикуем закрытые акции и сгорающие купоны каждый день
              </p>
            </div>
            <a
              href={CHANNELS.telegram}
              target="_blank"
              rel="noopener nofollow"
              className="mt-3 sm:mt-0 inline-flex items-center justify-center gap-1.5 shrink-0 rounded-xl bg-ink px-5 py-2.5 text-xs font-bold text-white shadow-offset-red transition-all hover:translate-y-[1px] hover:shadow-none"
            >
              Подписаться на канал →
            </a>
          </section>

          <div className="mt-8 flex items-center justify-between">
            <Link
              href="/sovety"
              className="text-xs font-bold text-ink/60 hover:text-ink transition-colors"
            >
              ← Назад ко всем статьям
            </Link>
            <Link
              href="/"
              className="text-xs font-bold text-red hover:underline"
            >
              В каталог промокодов →
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
