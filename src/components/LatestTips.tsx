import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

export default function LatestTips({ limit = 3 }: { limit?: number }) {
  const items = [...ARTICLES].reverse().slice(0, limit);

  return (
    <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-extrabold sm:text-3xl">
            Свежие советы по экономии
          </h2>
          <p className="mt-3 max-w-2xl text-ink/60">
            Практические гайды: как тратить меньше на продукты, косметику,
            маркетплейсы и путешествия.
          </p>
        </div>
        <Link
          href="/sovety"
          className="hidden shrink-0 rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white transition-colors sm:inline-block"
        >
          Все советы →
        </Link>
      </div>

      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((a) => (
          <Link
            key={a.slug}
            href={`/sovety/${a.slug}`}
            className="group flex flex-col rounded-2xl border border-line bg-white p-6 transition-shadow hover:shadow-offset-red"
          >
            <h3 className="font-display text-lg font-extrabold leading-snug group-hover:text-red transition-colors">
              {a.title}
            </h3>
            <p className="mt-3 flex-1 text-sm text-ink/60">{a.description}</p>
            <span className="mt-4 font-semibold text-red">Читать →</span>
          </Link>
        ))}
      </div>

      <Link
        href="/sovety"
        className="mt-6 inline-block rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-ink hover:text-white transition-colors sm:hidden"
      >
        Все советы →
      </Link>
    </section>
  );
}
