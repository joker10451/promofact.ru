import Link from "next/link";
import { getCategories } from "@/lib/perfluence";
import { COLLECTIONS } from "@/lib/collections";
import { plural } from "@/lib/format";
import Icon from "@/components/Icon";
import {
  CATEGORY_GROUPS,
  getCategoryDef,
  canonicalCategorySlug,
} from "@/lib/categoryTaxonomy";

/**
 * Каталог категорий на главной.
 *
 * Раньше это был плоский список из восемнадцати крупных вертикальных плиток —
 * на телефоне он занимал два полных экрана и никак не соотносился с разделами
 * меню в шапке. Теперь категории сгруппированы теми же пятью разделами, что и
 * в меню, а плитки горизонтальные и компактные: то же содержимое умещается
 * заметно плотнее, и структура каталога читается одинаково везде.
 *
 * Иконки и подписи берутся из справочника, а не из имени в фиде: оно
 * различается от источника к источнику, и один раздел мог называться
 * по-разному в меню и на главной.
 */
export default async function VisualCategoryTiles() {
  const categories = await getCategories();
  if (categories.length === 0) return null;

  // Счётчики складываем по каноническому слагу: исторические дубли категорий
  // должны схлопываться в один раздел, а не делить купоны между собой.
  const counts = new Map<string, number>();
  for (const c of categories) {
    const slug = canonicalCategorySlug(c.slug);
    counts.set(slug, (counts.get(slug) ?? 0) + c.count);
  }

  const groups = CATEGORY_GROUPS.map((g) => ({
    ...g,
    items: g.categorySlugs
      .map((slug) => {
        const def = getCategoryDef(slug);
        const count = counts.get(slug) ?? 0;
        // Пустые разделы не показываем: ссылка на категорию без предложений
        // раздражает сильнее, чем её отсутствие.
        return def && count > 0 ? { ...def, count } : null;
      })
      .filter((i): i is NonNullable<typeof i> => i !== null)
      .sort((a, b) => b.count - a.count),
  })).filter((g) => g.items.length > 0);

  if (groups.length === 0) return null;

  return (
    <section className="py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="mb-6">
          <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-ink">
            Скидки по категориям
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-ink/60 font-medium">
            Выберите категорию, чтобы найти промокод
          </p>
        </div>

        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((g) => (
            <div key={g.id}>
              <h3 className="mb-2.5 flex items-center gap-2 text-xs font-extrabold uppercase tracking-wide text-ink/45">
                <Icon name={g.id} size={15} className="text-ink/40" />
                <span>{g.label}</span>
              </h3>

              <ul className="space-y-1">
                {g.items.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/category/${c.slug}`}
                      className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2 transition-colors hover:bg-paper"
                    >
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-paper text-ink/55 transition-colors group-hover:bg-white group-hover:text-red">
                        <Icon name={c.slug} size={17} />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink transition-colors group-hover:text-red">
                        {c.label}
                      </span>
                      {/* Голое число рядом с названием непонятно на слух, поэтому
                          для программ чтения с экрана раскрываем его полностью. */}
                      <span
                        className="shrink-0 text-[11px] font-semibold tabular-nums text-ink/40"
                        aria-label={`${c.count} ${plural(c.count, "промокод", "промокода", "промокодов")}`}
                      >
                        {c.count}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Популярные тематические подборки */}
        <div className="mt-9 border-t border-line/70 pt-7">
          <div className="mb-3.5">
            <h3 className="font-display text-lg sm:text-xl font-extrabold text-ink">
              Популярные подборки
            </h3>
            <p className="mt-0.5 text-xs sm:text-sm text-ink/60 font-medium">
              Готовые коллекции проверенных промокодов под разные поводы
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {COLLECTIONS.map((col) => (
              <Link
                key={col.slug}
                href={`/collections/${col.slug}`}
                className="group inline-flex items-center gap-2 rounded-xl border border-line bg-white px-3.5 py-2 text-xs sm:text-sm font-bold text-ink shadow-2xs transition-all hover:border-red hover:text-red hover:shadow-xs"
              >
                <Icon name={col.slug} size={15} className="text-ink/45 transition-colors group-hover:text-red" />
                <span>{col.name}</span>
                <span className="text-xs text-ink/35 transition-colors group-hover:text-red" aria-hidden>→</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
