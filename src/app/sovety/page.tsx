import type { Metadata } from "next";
import Link from "next/link";
import { ARTICLES } from "@/lib/articles";
import { SITE_URL } from "@/lib/site";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: "Советы по экономии — ПромоФакт",
  description:
    "Практические советы по экономии: как тратить меньше на продукты, косметику, маркетплейсы и путешествия. Рабочие промокоды и лайфхаки шопинга.",
  alternates: { canonical: `${SITE_URL}/sovety` },
  openGraph: {
    title: "Советы по экономии — ПромоФакт",
    description:
      "Практические советы по экономии: как тратить меньше на продукты, косметику, маркетплейсы и путешествия.",
    url: `${SITE_URL}/sovety`,
    type: "website",
    locale: "ru_RU",
    siteName: "ПромоФакт",
  },
};

export default function SovetyPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
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
        <span aria-current="page">Советы</span>
      </nav>

      <h1 className="mt-6 max-w-3xl font-display text-2xl font-extrabold leading-tight sm:text-3xl">
        Советы по экономии
      </h1>
      <p className="mt-3 max-w-2xl text-ink/60">
        Практические гайды: как тратить меньше на продукты, косметику,
        маркетплейсы и путешествия. С рабочими промокодами и лайфхаками шопинга.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2">
        {ARTICLES.map((a) => (
          <Link
            key={a.slug}
            href={`/sovety/${a.slug}`}
            className="group flex flex-col rounded-2xl border border-line bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_8px_0_rgba(11,16,43,0.08)]"
          >
            <h2 className="font-display text-lg font-extrabold leading-snug group-hover:text-red transition-colors">
              {a.title}
            </h2>
            <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/60">
              {a.description}
            </p>
            <span className="mt-4 text-sm font-bold text-ink/80 group-hover:text-red">
              Читать →
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
