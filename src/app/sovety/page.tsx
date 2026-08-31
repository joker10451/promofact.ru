import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: `Советы по экономии и гиды по промокодам (${ARTICLES.length} статей) — ПромоФакт`,
  description:
    "Практические советы и инструкции: как экономить на доставке продуктов, бронировании отелей, косметике, цветах и подписках. Рабочие промокоды и секреты шопинга.",
  alternates: { canonical: `${SITE_URL}/sovety` },
  openGraph: {
    title: `Советы по экономии и гиды по промокодам — ПромоФакт`,
    description:
      "Практические советы и инструкции: как экономить на доставке продуктов, бронировании отелей, косметике, цветах и подписках.",
    url: `${SITE_URL}/sovety`,
    type: "website",
    locale: "ru_RU",
    siteName: "ПромоФакт",
  },
};

export default function SovetyPage() {
  const articles = [...ARTICLES].reverse();

  return (
    <>
      <Header />

      <main className="min-h-screen bg-paper/40 py-10 sm:py-14 border-b border-line">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
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
            <span aria-current="page" className="text-ink">
              Советы по экономии
            </span>
          </nav>

          <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-line">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow/40 px-3 py-1 text-[11px] font-bold text-ink mb-2">
                <span>📚</span>
                <span>База знаний ПромоФакта</span>
              </div>
              <h1 className="font-display text-3xl sm:text-4xl font-black leading-tight text-ink">
                Советы по экономии и шопингу
              </h1>
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-ink/65 font-medium">
                {ARTICLES.length} проверенных инструкций: как выжимать максимум выгоды из промокодов, кэшбэка и акций любимых брендов.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-ink/70">
              <span className="rounded-full bg-mint/20 px-3 py-1 text-mint-dark">
                ✓ Обновлено в 2026
              </span>
            </div>
          </div>

          {/* Сетка статей */}
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((a) => (
              <Link
                key={a.slug}
                href={`/sovety/${a.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-ink/25 hover:shadow-md"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-bold text-ink/40 mb-3">
                    <span className="uppercase tracking-wider">Инструкция</span>
                    <span>⏱ 3–4 мин</span>
                  </div>
                  <h2 className="font-display text-base sm:text-lg font-bold leading-snug text-ink group-hover:text-red transition-colors">
                    {a.title}
                  </h2>
                  <p className="mt-3 text-xs sm:text-sm leading-relaxed text-ink/60 line-clamp-3">
                    {a.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-line/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-red group-hover:underline">
                    Читать статью →
                  </span>
                  <span className="text-[11px] font-semibold text-mint-dark">
                    ✓ Проверено
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
