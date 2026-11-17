import StoreLogo from "@/components/StoreLogo";
import type { ArticleLink } from "@/lib/articles";
import { articleCoverFacts } from "@/lib/articleCover";

/**
 * Обложка статьи про конкретный магазин: логотип и выгода из заголовка.
 *
 * У статей без магазина обложки нет. Пастельная плашка с иконкой темы
 * (PR #204) заполняла пустоту, но в строгой сетке читалась как заглушка:
 * текстовая карточка с заголовком выглядит честнее.
 */

export default function ArticleCover({
  title,
  related,
  className = "",
  iconSize = 34,
}: {
  slug: string;
  title: string;
  related?: ArticleLink[];
  className?: string;
  iconSize?: number;
}) {
  const { store, benefit } = articleCoverFacts(title, related);

  // Статья про конкретный магазин: логотип и выгода из заголовка вместо
  // одинаковой пастельной плашки с иконкой — карточки различаются по сути.
  if (store) {
    // Не крупнее 64 px: растровые логотипы из фида при увеличении размываются.
    const logoSize = Math.min(64, Math.round(iconSize * 1.3));
    return (
      <div
        className={`relative flex items-center justify-center gap-4 overflow-hidden rounded-lg border border-line bg-paper text-ink/45 ${className}`}
        aria-hidden
      >
        <span className="flex shrink-0 items-center justify-center rounded-lg border border-line bg-white p-1.5">
          {/* На странице статьи обложка в первом экране — логотип грузим сразу. */}
          <StoreLogo slug={store.slug} name={store.name} size={logoSize} priority={iconSize >= 60} />
        </span>
        {benefit && (
          <span className={`font-display font-extrabold leading-none tabular-nums text-ink ${iconSize >= 60 ? "text-4xl sm:text-5xl" : "text-2xl"}`}>
            {benefit}
          </span>
        )}
      </div>
    );
  }

  return null;
}
