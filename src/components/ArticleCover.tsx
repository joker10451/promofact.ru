import Icon from "@/components/Icon";
import StoreLogo from "@/components/StoreLogo";
import type { ArticleLink } from "@/lib/articles";
import { articleCoverFacts } from "@/lib/articleCover";

/**
 * Обложка статьи, собираемая из её же данных.
 *
 * Картинка есть ровно у одной статьи из сорока восьми, поэтому карточки в
 * списке были полностью текстовыми — ряд одинаковых прямоугольников, в
 * которых глазу не за что зацепиться. Искать или рисовать полсотни
 * иллюстраций — отдельная задача, а до тех пор пустота выглядит как недоделка.
 *
 * Обложка выводится из заголовка: тема определяет иконку, а слаг —
 * устойчивый выбор палитры. Одна и та же статья всегда получает одну и ту же
 * обложку, при этом соседние карточки в списке различаются. Это не подмена
 * иллюстрации, а честное типографское оформление: оно не притворяется
 * фотографией и не несёт ложного смысла.
 */

/** Палитры подобраны под фон страницы; порядок важен — индекс берётся из слага. */
const PALETTES = [
  "from-red/12 via-yellow/10 to-transparent text-red",
  "from-mint/18 via-mint/8 to-transparent text-mint-dark",
  "from-indigo-400/14 via-sky-300/10 to-transparent text-indigo-500",
  "from-amber-400/16 via-orange-300/10 to-transparent text-amber-600",
  "from-violet-400/14 via-fuchsia-300/10 to-transparent text-violet-500",
  "from-teal-400/16 via-cyan-300/10 to-transparent text-teal-600",
];

/**
 * Тема статьи по ключевым словам заголовка. Порядок проверок важен:
 * специфичное раньше общего, иначе «промокод на доставку еды» уйдёт в общий
 * раздел промокодов вместо еды.
 */
function topicIcon(title: string): string {
  const t = title.toLowerCase();
  if (/достав|еда|продукт|ресторан|пицц|суши|кофе/.test(t)) return "dostavka-iz-restoranov";
  if (/космет|парфюм|уход|красот|макияж/.test(t)) return "kosmetika-i-parfyumeriya";
  if (/аптек|витамин|здоров|лекарств/.test(t)) return "zdorove-i-vitaminy";
  if (/одежд|обув|гардероб|мод/.test(t)) return "odezhda-i-obuv";
  if (/детск|ребён|ребен|игрушк/.test(t)) return "detskie-tovary";
  if (/отел|путешеств|тур|билет|отпуск|авиа/.test(t)) return "puteshestviya-i-turizm";
  if (/кино|сериал|подписк|стриминг/.test(t)) return "onlayn-kinoteatry";
  if (/курс|обучен|образован|школ|английск/.test(t)) return "onlayn-obrazovanie";
  if (/техник|гаджет|смартфон|ноутбук|электрон/.test(t)) return "elektronika-i-tehnika";
  if (/дом|мебел|интерьер|уют|посуд/.test(t)) return "vse-dlya-doma";
  if (/цвет|букет|подар/.test(t)) return "tsvety";
  if (/кэшбэк|эконом|выгод|деньг|бюджет|скидк|распродаж/.test(t)) return "coins";
  if (/маркетплейс|озон|wildberries|яндекс маркет/.test(t)) return "marketpleysy";
  if (/промокод|купон|код/.test(t)) return "tag";
  return "clipboard";
}

/** Устойчивый индекс палитры: одна статья — всегда одна обложка. */
function paletteIndex(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % PALETTES.length;
}

export default function ArticleCover({
  slug,
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
  const palette = PALETTES[paletteIndex(slug)];
  const { store, benefit } = articleCoverFacts(title, related);

  // Статья про конкретный магазин: логотип и выгода из заголовка вместо
  // одинаковой пастельной плашки с иконкой — карточки различаются по сути.
  if (store) {
    // Не крупнее 64 px: растровые логотипы из фида при увеличении размываются.
    const logoSize = Math.min(64, Math.round(iconSize * 1.3));
    return (
      <div
        className={`relative flex items-center justify-center gap-4 overflow-hidden rounded-xl bg-gradient-to-br ${palette} ${className}`}
        aria-hidden
      >
        <span className="flex shrink-0 items-center justify-center rounded-2xl border border-line bg-white p-1.5 shadow-2xs">
          <StoreLogo slug={store.slug} name={store.name} size={logoSize} />
        </span>
        {benefit && (
          <span className={`font-display font-extrabold leading-none text-red ${iconSize >= 60 ? "text-4xl sm:text-5xl" : "text-2xl"}`}>
            {benefit}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br ${palette} ${className}`}
      aria-hidden
    >
      {/* Иконка крупная и приглушённая: она задаёт настроение, но не спорит
          с заголовком, который стоит рядом в карточке. */}
      <Icon name={topicIcon(title)} size={iconSize} className="opacity-40" />
    </div>
  );
}
