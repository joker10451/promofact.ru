/**
 * Иконки категорий каталога.
 *
 * Раньше здесь стояли эмодзи. Они выглядят чужеродно: рисуются шрифтом
 * операционной системы, поэтому на Windows, macOS и Android выглядят по-разному,
 * не подчиняются цвету текста и на фоне аккуратной вёрстки читаются как
 * временная заглушка.
 *
 * Набор нарисован в одной системе: сетка 24×24, штрих 1.7, скруглённые
 * концы, цвет наследуется от currentColor. За счёт этого иконки совпадают
 * по плотности с текстом и перекрашиваются вместе с ним при наведении.
 */

type IconProps = { className?: string; size?: number };

const PATHS: Record<string, React.ReactNode> = {
  // Еда и продукты
  "dostavka-produktov": (
    <>
      <path d="M4 6h2l2.2 9.2a1.6 1.6 0 0 0 1.6 1.3h7.3a1.6 1.6 0 0 0 1.6-1.2L20.5 9H6.4" />
      <circle cx="10" cy="20" r="1.3" />
      <circle cx="17.5" cy="20" r="1.3" />
    </>
  ),
  "dostavka-iz-restoranov": (
    <>
      <path d="M3.5 11.5h17a8.5 8.5 0 0 1-8.5 7.5 8.5 8.5 0 0 1-8.5-7.5Z" />
      <path d="M6 8.5c0-1.4 1-2 1-3M10 8.5c0-1.4 1-2 1-3M14 8.5c0-1.4 1-2 1-3" />
    </>
  ),
  "produkty-i-napitki": (
    <>
      <path d="M5 8h11v7a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" />
      <path d="M16 10h1.8a2.2 2.2 0 0 1 0 4.4H16" />
      <path d="M8 3.5c0 1-.8 1.3-.8 2.2M12 3.5c0 1-.8 1.3-.8 2.2" />
    </>
  ),

  // Красота и здоровье
  "kosmetika-i-parfyumeriya": (
    <>
      <path d="M12 3.5c3.2 3.6 5 6.3 5 8.7a5 5 0 0 1-10 0c0-2.4 1.8-5.1 5-8.7Z" />
    </>
  ),
  "zdorove-i-vitaminy": (
    <>
      <rect x="3.2" y="9" width="17.6" height="6" rx="3" transform="rotate(-45 12 12)" />
      <path d="M9.2 9.2 14.8 14.8" />
    </>
  ),
  "sport-i-otdyh": (
    <>
      <circle cx="5.5" cy="17" r="3" />
      <circle cx="18.5" cy="17" r="3" />
      <path d="m5.5 17 4-8h4l3 8M10 6.5h3.5" />
    </>
  ),

  // Дом, одежда, техника
  "odezhda-i-obuv": (
    <>
      <path d="M8.5 4 5 6v4.5h2.5V20h9v-9.5H19V6l-3.5-2" />
      <path d="M8.5 4a3.5 3.5 0 0 0 7 0" />
    </>
  ),
  "detskie-tovary": (
    <>
      <circle cx="12" cy="9" r="5" />
      <path d="M12 14v4M9.5 20.5 12 18l2.5 2.5" />
      <path d="M7.5 5.5 6 3.5M16.5 5.5 18 3.5" />
    </>
  ),
  "vse-dlya-doma": (
    <>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 10v9.5h12V10" />
      <path d="M10 19.5V14h4v5.5" />
    </>
  ),
  "elektronika-i-tehnika": (
    <>
      <rect x="7" y="2.8" width="10" height="18.4" rx="2.2" />
      <path d="M10.8 5.6h2.4" />
      <path d="M10.5 18.4h3" />
    </>
  ),
  ukrasheniya: (
    <>
      <path d="m7 4 -3.5 5L12 20l8.5-11L17 4H7Z" />
      <path d="m3.5 9h17M9.5 4 12 20l2.5-16" />
    </>
  ),

  // Сервисы и развлечения
  "onlayn-kinoteatry": (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2.5" />
      <path d="M10 9.2v5.6l4.5-2.8-4.5-2.8Z" />
    </>
  ),
  "servisy-i-podpiski": (
    <>
      <path d="M13.2 3 5 13.4h5.2L9.8 21 19 10.4h-5.4L13.2 3Z" />
    </>
  ),
  "onlayn-obrazovanie": (
    <>
      <path d="m12 4 9 4.3-9 4.3-9-4.3L12 4Z" />
      <path d="M6.5 10.6V16c0 1.5 2.5 2.8 5.5 2.8s5.5-1.3 5.5-2.8v-5.4" />
      <path d="M21 8.3v5" />
    </>
  ),
  razvlecheniya: (
    <>
      <path d="M3.5 8.5A2 2 0 0 0 5.5 6.5h13a2 2 0 0 0 2 2 2 2 0 0 0 0 7 2 2 0 0 0-2 2h-13a2 2 0 0 0-2-2 2 2 0 0 0 0-7Z" />
      <path d="M12 8.2v1.6M12 11.4v1.6M12 14.6v1.6" />
    </>
  ),
  "svyaz-i-internet": (
    <>
      <path d="M4.5 19.5V14M9.5 19.5V10.5M14.5 19.5V7M19.5 19.5V4" />
    </>
  ),

  // Путешествия и подарки
  "puteshestviya-i-turizm": (
    <>
      <path d="M10.2 3.6a1.6 1.6 0 0 1 3 .5l.4 5.2 6.1 3a1.4 1.4 0 0 1 .8 1.3v1l-6.6-1.7-.6 3.9 2.2 1.8v1.4l-3.6-1-3.6 1v-1.4l2.2-1.8-.6-3.9L3.5 14.6v-1a1.4 1.4 0 0 1 .8-1.3l6.1-3 .4-5.2Z" />
    </>
  ),
  tsvety: (
    <>
      <circle cx="12" cy="8" r="2.4" />
      <path d="M12 5.6a2.6 2.6 0 1 0-2.3 2.5M12 5.6a2.6 2.6 0 1 1 2.3 2.5M9.7 8.1a2.6 2.6 0 1 0 1 3M14.3 8.1a2.6 2.6 0 1 1-1 3" />
      <path d="M12 12.5V21" />
    </>
  ),
  marketpleysy: (
    <>
      <path d="M3.5 7.5 12 3.5l8.5 4v9L12 20.5l-8.5-4v-9Z" />
      <path d="m3.5 7.5 8.5 4 8.5-4M12 11.5v9" />
    </>
  ),
  raznoe: (
    <>
      <path d="M4 11.2V5.5A1.5 1.5 0 0 1 5.5 4h5.7a1.5 1.5 0 0 1 1 .45l7.3 7.3a1.5 1.5 0 0 1 0 2.1l-5.7 5.7a1.5 1.5 0 0 1-2.1 0l-7.3-7.3a1.5 1.5 0 0 1-.4-1.05Z" />
      <circle cx="8" cy="8" r="1.2" />
    </>
  ),
  // Для подборок, у которых нет парной категории
  gift: (
    <>
      <rect x="3.5" y="9" width="17" height="11" rx="1.6" />
      <path d="M3 9h18M12 9v11" />
      <path d="M12 9C10.5 6 9 4.8 7.5 4.8a2.1 2.1 0 0 0 0 4.2M12 9c1.5-3 3-4.2 4.5-4.2a2.1 2.1 0 0 1 0 4.2" />
    </>
  ),
  star: (
    <>
      <path d="m12 3.8 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.9l5.8-.8L12 3.8Z" />
    </>
  ),
};

/** Иконки разделов верхнего уровня переиспользуют рисунок опорной категории. */
const GROUP_ALIAS: Record<string, string> = {
  eda: "dostavka-iz-restoranov",
  krasota: "kosmetika-i-parfyumeriya",
  dom: "vse-dlya-doma",
  servisy: "onlayn-kinoteatry",
  puteshestviya: "puteshestviya-i-turizm",
};

/** Подборки переиспользуют рисунок родственной категории. */
const COLLECTION_ALIAS: Record<string, string> = {
  "first-order": "gift",
  "food-delivery": "dostavka-iz-restoranov",
  exclusive: "star",
  "vecher-kino": "onlayn-kinoteatry",
  "krasota-i-parfyum": "kosmetika-i-parfyumeriya",
  "vygodnye-oteli": "puteshestviya-i-turizm",
};

export default function CategoryIcon({
  name,
  className = "",
  size = 20,
}: IconProps & { name: string }) {
  const key = GROUP_ALIAS[name] ?? COLLECTION_ALIAS[name] ?? name;
  const path = PATHS[key] ?? PATHS.raznoe;

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      focusable="false"
      className={className}
    >
      {path}
    </svg>
  );
}
