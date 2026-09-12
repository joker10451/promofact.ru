/**
 * Канонический справочник категорий каталога.
 *
 * Зачем он нужен. Раньше категория выводилась только по ключевым словам в
 * названии магазина (inferCategory), а всё неопознанное падало в дефолт
 * «Маркетплейсы». Но названия магазинов — это бренды: «Befree», «SUNLIGHT»,
 * «Foxford» не содержат ни одного ключевого слова. В результате 134 купона
 * из 199 оказались в «Маркетплейсах», то есть две трети каталога лежали в
 * категории, к которой почти не относились.
 *
 * Здесь два механизма, закрывающих эту дыру:
 *   1. BRAND_CATEGORY — явное соответствие «бренд → категория». Единственный
 *      надёжный способ разложить бренды, у которых имя ничего не говорит.
 *   2. CATEGORY_GROUPS — группировка категорий в разделы меню, чтобы каталог
 *      можно было показать многоколоночным меню, а не плоским списком.
 *
 * Дефолтом теперь служит «Разное», а не «Маркетплейсы»: честнее показать
 * пользователю нейтральную корзину, чем выдавать свалку за осмысленный раздел.
 */

export interface CategoryDef {
  slug: string;
  /** Название в единственном числе, как заголовок раздела */
  label: string;
  /** Короткое описание для страницы категории и подсказки в меню */
  blurb: string;
}

export interface CategoryGroup {
  id: string;
  label: string;
  categorySlugs: string[];
}

/** Все категории каталога. Порядок внутри группы — как показывать в меню. */
export const CATEGORIES: CategoryDef[] = [
  // Еда и продукты
  { slug: "dostavka-produktov", label: "Доставка продуктов", blurb: "Супермаркеты и сервисы доставки продуктов на дом" },
  { slug: "dostavka-iz-restoranov", label: "Доставка из ресторанов", blurb: "Рестораны, суши, пицца и готовая еда" },
  { slug: "produkty-i-napitki", label: "Продукты и напитки", blurb: "Кофе, чай, деликатесы и фермерские продукты" },

  // Красота и здоровье
  { slug: "kosmetika-i-parfyumeriya", label: "Косметика и парфюмерия", blurb: "Уход, макияж, парфюмерия и средства для волос" },
  { slug: "zdorove-i-vitaminy", label: "Аптека и здоровье", blurb: "Аптеки, витамины, БАДы и оптика" },

  // Одежда и дом
  { slug: "odezhda-i-obuv", label: "Одежда и обувь", blurb: "Одежда, обувь и аксессуары для всей семьи" },
  { slug: "detskie-tovary", label: "Детские товары", blurb: "Игрушки, одежда и товары для малышей" },
  { slug: "vse-dlya-doma", label: "Всё для дома", blurb: "Мебель, посуда, текстиль и товары для уюта" },
  { slug: "elektronika-i-tehnika", label: "Электроника и техника", blurb: "Гаджеты, бытовая техника и комплектующие" },
  { slug: "ukrasheniya", label: "Украшения и часы", blurb: "Ювелирные изделия, бижутерия и часы" },

  // Развлечения и сервисы
  { slug: "onlayn-kinoteatry", label: "Онлайн-кинотеатры", blurb: "Подписки на фильмы, сериалы и ТВ" },
  { slug: "servisy-i-podpiski", label: "Сервисы и подписки", blurb: "Антивирусы, VPN, облака и цифровые подписки" },
  { slug: "onlayn-obrazovanie", label: "Онлайн-образование", blurb: "Курсы, школы, репетиторы и профессии" },
  { slug: "razvlecheniya", label: "Развлечения и события", blurb: "Билеты в кино, театры, концерты и парки" },
  { slug: "svyaz-i-internet", label: "Связь и интернет", blurb: "Мобильные операторы, тарифы и домашний интернет" },

  // Путешествия и прочее
  { slug: "puteshestviya-i-turizm", label: "Путешествия и туризм", blurb: "Отели, авиабилеты, туры и аренда жилья" },
  { slug: "sport-i-otdyh", label: "Спорт и отдых", blurb: "Спортивные товары, велосипеды и снаряжение" },
  { slug: "tsvety", label: "Цветы и подарки", blurb: "Букеты, доставка цветов и подарочные наборы" },
  { slug: "marketpleysy", label: "Маркетплейсы", blurb: "Крупные торговые площадки с товарами всех категорий" },
  { slug: "raznoe", label: "Разное", blurb: "Предложения, не вошедшие в другие разделы" },
];

/** Разделы верхнего уровня для многоколоночного меню в шапке. */
export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    id: "eda",
    label: "Еда и продукты",
   
    categorySlugs: ["dostavka-produktov", "dostavka-iz-restoranov", "produkty-i-napitki"],
  },
  {
    id: "krasota",
    label: "Красота и здоровье",
   
    categorySlugs: ["kosmetika-i-parfyumeriya", "zdorove-i-vitaminy", "sport-i-otdyh"],
  },
  {
    id: "dom",
    label: "Дом, одежда, техника",
   
    categorySlugs: ["odezhda-i-obuv", "detskie-tovary", "vse-dlya-doma", "elektronika-i-tehnika", "ukrasheniya"],
  },
  {
    id: "servisy",
    label: "Сервисы и развлечения",
   
    categorySlugs: ["onlayn-kinoteatry", "servisy-i-podpiski", "onlayn-obrazovanie", "razvlecheniya", "svyaz-i-internet"],
  },
  {
    id: "puteshestviya",
    label: "Путешествия и подарки",
   
    categorySlugs: ["puteshestviya-i-turizm", "tsvety", "marketpleysy", "raznoe"],
  },
];

const BY_SLUG = new Map(CATEGORIES.map((c) => [c.slug, c]));

export function getCategoryDef(slug: string): CategoryDef | undefined {
  return BY_SLUG.get(slug);
}

/**
 * Слияние исторических дублей: фиды отдавали разные ярлыки для одного и того же
 * смысла («Красота и косметика» и «Косметика и парфюмерия», «Продукты и
 * доставка» и «Доставка продуктов»), и каталог показывал их как разные разделы.
 * Старые слаги остаются рабочими ссылками, но ведут в канонический раздел.
 */
export const CATEGORY_ALIASES: Record<string, string> = {
  "krasota-i-kosmetika": "kosmetika-i-parfyumeriya",
  "produkty-i-dostavka": "dostavka-produktov",
  "knigi-i-obuchenie": "onlayn-obrazovanie",
  knigi: "onlayn-obrazovanie",
  "zdorove-i-krasota": "kosmetika-i-parfyumeriya",
  avtotovary: "raznoe",
};

export function canonicalCategorySlug(slug: string): string {
  const s = slug.toLowerCase().trim();
  return CATEGORY_ALIASES[s] ?? s;
}

/**
 * Явное соответствие «бренд → категория».
 *
 * Ключ — название магазина в нижнем регистре, как приходит из фида (сравнение
 * идёт по нормализованной строке, см. categoryForStore). Правила по ключевым
 * словам здесь бессильны: «Befree», «SUNLIGHT», «Foxford», «Askona» — бренды,
 * из имени которых предметная область не выводится. Поэтому единственный
 * надёжный путь — перечислить их руками.
 *
 * Список составлен по реальному каталогу: магазины, которые фактически
 * присутствуют в выдаче, а не гипотетические.
 */
export const BRAND_CATEGORY: Record<string, string> = {
  // Продукты и супермаркеты
  "пятёрочка доставка": "dostavka-produktov",
  "пятерочка доставка": "dostavka-produktov",
  самокат: "dostavka-produktov",
  "магнит доставка": "dostavka-produktov",
  вкусвилл: "dostavka-produktov",
  перекрёсток: "dostavka-produktov",

  // Рестораны и готовая еда
  "важная рыба": "dostavka-iz-restoranov",
  "пироги №1": "dostavka-iz-restoranov",
  "simply meal": "dostavka-iz-restoranov",
  pizzasushiwok: "dostavka-iz-restoranov",
  "sushi gallery": "dostavka-iz-restoranov",
  mirsushi: "dostavka-iz-restoranov",
  "prostoeda.pro": "dostavka-iz-restoranov",
  tanukifamily: "dostavka-iz-restoranov",
  "post meridiem": "dostavka-iz-restoranov",

  // Продукты и напитки
  "tasty coffee": "produkty-i-napitki",
  "colla gen": "produkty-i-napitki",

  // Косметика и парфюмерия
  "yves rocher": "kosmetika-i-parfyumeriya",
  "золотое яблоко": "kosmetika-i-parfyumeriya",
  randewoo: "kosmetika-i-parfyumeriya",
  aravia: "kosmetika-i-parfyumeriya",
  dewal: "kosmetika-i-parfyumeriya",
  irnby: "kosmetika-i-parfyumeriya",

  // Аптека и здоровье
  максавит: "zdorove-i-vitaminy",
  очкарик: "zdorove-i-vitaminy",
  "iherb.group": "zdorove-i-vitaminy",

  // Одежда и обувь
  befree: "odezhda-i-obuv",
  "love republic": "odezhda-i-obuv",
  "street beat": "odezhda-i-obuv",
  superstep: "odezhda-i-obuv",
  "finn flare": "odezhda-i-obuv",
  kanzler: "odezhda-i-obuv",
  elyts: "odezhda-i-obuv",

  // Дом, мебель, техника
  askona: "vse-dlya-doma",
  lazurit: "vse-dlya-doma",
  "fix price": "vse-dlya-doma",
  tefal: "elektronika-i-tehnika",
  itab: "elektronika-i-tehnika",

  // Украшения
  sunlight: "ukrasheniya",

  // Онлайн-образование
  foxford: "onlayn-obrazovanie",
  skysmart: "onlayn-obrazovanie",
  netology: "onlayn-obrazovanie",
  tutoronline: "onlayn-obrazovanie",
  инглекс: "onlayn-obrazovanie",
  productstar: "onlayn-obrazovanie",
  "яндекс практикум": "onlayn-obrazovanie",
  uchmet: "onlayn-obrazovanie",
  seneca: "onlayn-obrazovanie",
  квантастика: "onlayn-obrazovanie",

  // Кино и развлечения
  кинопоиск: "onlayn-kinoteatry",
  kion: "onlayn-kinoteatry",
  korston: "razvlecheniya",
  "broadway-moscow": "razvlecheniya",
  "afisha.yandex": "razvlecheniya",
  muzloto: "razvlecheniya",
  "король говорит!": "razvlecheniya",
  winline: "razvlecheniya",

  // Сервисы и подписки
  kaspersky: "servisy-i-podpiski",
  pro32: "servisy-i-podpiski",
  "яндекс плюс": "servisy-i-podpiski",
  speech2text: "servisy-i-podpiski",
  "redsolution.company": "servisy-i-podpiski",
  копирка: "servisy-i-podpiski",
  gruzovichkof: "servisy-i-podpiski",

  // Связь
  "интернет-магазин билайн": "svyaz-i-internet",
  билайн: "svyaz-i-internet",
  мегафон: "svyaz-i-internet",

  // Путешествия
  отелло: "puteshestviya-i-turizm",
  otello: "puteshestviya-i-turizm",

  // Спорт
  velodrive_ru: "sport-i-otdyh",

  // Цветы и подарки
  "яндекс цветы": "tsvety",
  союзцветторг: "tsvety",
  flowwow: "tsvety",
  fmart: "tsvety",

  // Настоящие маркетплейсы — их действительно немного
  "яндекс маркет": "marketpleysy",
  aliexpress: "marketpleysy",
  "aliexpress ru&cis": "marketpleysy",
  shoppinglive: "marketpleysy",
  "пикабу промокоды": "marketpleysy",
};

/** Приводит название магазина к ключу карты брендов. */
function brandKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+(ww|ru|by|kz|ae|sa|eg)$/i, "")
    .replace(/[«»"']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Категория магазина: сначала явный бренд, затем — переданный запасной
 * вариант (обычно результат inferCategory по ключевым словам).
 */
export function categoryForStore(storeName: string, fallbackSlug?: string): string {
  const key = brandKey(storeName);
  if (BRAND_CATEGORY[key]) return BRAND_CATEGORY[key];

  // Бренд мог прийти с уточнением: «SUNLIGHT — ювелирный» и т. п.
  for (const [brand, slug] of Object.entries(BRAND_CATEGORY)) {
    if (brand.length >= 5 && key.startsWith(brand)) return slug;
  }

  return canonicalCategorySlug(fallbackSlug || "raznoe");
}
