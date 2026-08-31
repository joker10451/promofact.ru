import Link from "next/link";
import { ARTICLES } from "@/lib/articles";

export default function LatestTips({ limit = 3 }: { limit?: number }) {
  const items = [...ARTICLES].reverse().slice(0, limit);

  return (
    <section className="py-12 sm:py-16 border-b border-line bg-paper/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-yellow/40 px-3 py-1 text-[11px] font-bold text-ink mb-2">
              <span>📚</span>
              <span>Блог и советы</span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
              Как экономить больше: гиды и лайфхаки
            </h2>
            <p className="mt-1 text-xs sm:text-sm text-ink/60 font-medium">
              Реальные инструкции по скидкам в популярных сервисах и магазинах
            </p>
          </div>
          <Link
            href="/sovety"
            className="self-start sm:self-auto inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-red hover:text-red-dark transition-colors"
          >
            Все {ARTICLES.length} статей блога →
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a, idx) => (
            <Link
              key={a.slug}
              href={`/sovety/${a.slug}`}
              className="group flex flex-col justify-between rounded-2xl border border-line bg-white p-6 shadow-2xs transition-all duration-200 hover:-translate-y-1 hover:border-ink/25 hover:shadow-md"
            >
              <div>
                <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-ink/40 mb-3">
                  <span className="uppercase tracking-wider">Гайд по экономии</span>
                  <span>⏱ 3 мин чтения</span>
                </div>
                <h3 className="font-display text-base sm:text-lg font-bold text-ink group-hover:text-red transition-colors line-clamp-2 leading-snug">
                  {a.title}
                </h3>
                <p className="mt-2.5 text-xs sm:text-sm text-ink/65 line-clamp-3 leading-relaxed">
                  {a.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-line/60 flex items-center justify-between">
                <span className="text-xs font-bold text-red group-hover:underline">
                  Читать инструкцию →
                </span>
                <span className="text-xs text-ink/40">✓ Проверено</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
