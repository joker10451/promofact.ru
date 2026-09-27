/**
 * Утилиты для поиска: нормализация, транслитерация, переключение раскладки клавиатуры и псевдонимы брендов.
 */

// Карта переключения английской раскладки на русскую (QWERTY -> ЙЦУКЕН)
const EN_TO_RU: Record<string, string> = {
  q: "й", w: "ц", e: "у", r: "к", t: "е", y: "н", u: "г", i: "ш", o: "щ", p: "з", "[": "х", "]": "ъ",
  a: "ф", s: "ы", d: "в", f: "а", g: "п", h: "р", j: "о", k: "л", l: "д", ";": "ж", "'": "э",
  z: "я", x: "ч", c: "с", v: "м", b: "и", n: "т", m: "ь", ",": "б", ".": "ю",
};

// Карта переключения русской раскладки на английскую (ЙЦУКЕН -> QWERTY)
const RU_TO_EN: Record<string, string> = Object.entries(EN_TO_RU).reduce(
  (acc, [en, ru]) => {
    acc[ru] = en;
    return acc;
  },
  {} as Record<string, string>
);

/**
 * Нормализует поисковую строку: приводит к нижнему регистру, заменяет «ё» на «е»,
 * убирает лишние пробелы и знаки пунктуации.
 */
export function normalizeSearchTerm(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Переключает строку между раскладками RU <-> EN (для исправления ввода «cfykfqn» -> «санлайт»).
 */
export function convertKeyboardLayout(str: string): string {
  if (!str) return "";
  const lower = str.toLowerCase();
  
  // Проверяем наличие латиницы
  let convertedRu = "";
  for (const ch of lower) {
    convertedRu += EN_TO_RU[ch] || ch;
  }
  if (convertedRu !== lower) return convertedRu;

  // Проверяем наличие кириллицы
  let convertedEn = "";
  for (const ch of lower) {
    convertedEn += RU_TO_EN[ch] || ch;
  }
  return convertedEn;
}

/**
 * Псевдонимы и ключевые слова для поиска по магазинам (латиница <-> кириллица, сленг, бренды)
 */
export const STORE_ALIASES: Record<string, string[]> = {
  "sunlight-ru": ["санлайт", "sunlight", "санлайт ру", "санлайтру", "ювелирный", "украшения", "золото", "бриллианты", "кольца"],
  "pyaterochka": ["пятерочка", "пятёрочка", "5ka", "5-ka", "pyaterochka", "пятерка", "доставка продуктов"],
  "samokat": ["самокат", "samokat", "доставка еды", "продукты за 15 минут"],
  "riv-gosh": ["рив гош", "ривгош", "rive gauche", "parfum", "парфюмерия", "косметика"],
  "zolotoe-yabloko": ["золотое яблоко", "золотоеяблоко", "gold apple", "goldapple", "зя", "косметика", "парфюм"],
  "sokolov-offline": ["соколов", "sokolov", "соколов ювелирный", "ювелирные изделия"],
  "yandex-market": ["яндекс маркет", "маркет", "yandex market", "ям"],
  "yandex-eda": ["яндекс еда", "yandex eda", "еда", "доставка ресторан", "рестораны"],
  "yandeks-lavka": ["яндекс лавка", "yandex lavka", "лавка", "быстрая доставка"],
  "yandeks-tsvety": ["яндекс цветы", "yandex flowers", "цветы", "букеты", "розы"],
  "yandex-music": ["яндекс музыка", "yandex music", "музыка", "подписка музыка"],
  "yandex-knigi": ["яндекс книги", "yandex books", "букмейт", "bookmate", "аудиокниги"],
  "yandeks-puteshestviya": ["яндекс путешествия", "yandex travel", "отели", "билеты", "гостиницы"],
  "yandeks-afisha": ["яндекс афиша", "yandex afisha", "билеты в кино", "концерты", "театр"],
  "kinopoisk": ["кинопоиск", "kinopoisk", "кино", "фильмы", "сериалы"],
  "ivi": ["иви", "ivi", "онлайн кинотеатр", "фильмы"],
  "start-ru": ["старт", "start", "старт ру", "сериалы"],
  "premier": ["премьер", "premier", "премьер тв"],
  "otello": ["отелло", "otello", "бронирование отелей", "гостиницы"],
  "t-puteshestviya-oteli": ["т-путешествия", "т путешествия", "тинькофф путешествия", "t-travel", "t-puteshestviya", "бронирование отелей", "гостиницы тинькофф"],
  "sberzdorovie": ["сберздоровье", "сбер здоровье", "sberhealth", "врач онлайн", "телемедицина", "сбер аптека", "консультация врача"],
  "magnit-dostavka": ["магнит доставка", "магнит", "magnit", "доставка магнит"],
  "magnit-plyus-premium": ["магнит плюс", "магнит премиум", "magnit plus"],
  "m-kosmetik": ["м косметик", "магнит косметик", "m kosmetik"],
  "letual": ["лэтуаль", "летуаль", "letual", "letoile", "парфюмерия"],
  "vazhnaya-ryba": ["важная рыба", "суши", "роллы", "рыба"],
  "tanukifamily": ["тануки", "tanuki", "японская кухня", "суши"],
  "dodo-pizza": ["додо", "додо пицца", "dodo", "пицца"],
  "ebidoebi": ["ебидоеби", "ёбидоёби", "суши"],
  "vkusvill-dostavka": ["вкусвилл", "vkusvill", "вкус вилл", "правильное питание"],
  "perekrestok-dostavka": ["перекресток", "перекрёсток", "perekrestok", "доставка продуктов"],
  "sberprime": ["сберпрайм", "сбер прайм", "sberprime", "сбер"],
  "detskie-platezhnye-aksessuary-ot-sbera": ["сбер дети", "детская карта", "платежный стикер", "сбер"],
  "litres": ["литрес", "litres", "книги", "электронные книги"],
  "tehnopark": ["технопарк", "tehnopark", "бытовая техника", "электроника"],
  "bethowen": ["бетховен", "bethowen", "зоомагазин", "корма для кошек и собак"],
  "randewoo": ["рандеву", "randewoo", "духи", "селективная парфюмерия"],
  "librederm": ["либридерм", "librederm", "аптечная косметика"],
  "iv-roshe": ["ив роше", "yves rocher", "растительная косметика"],
  "flowwow": ["флоувау", "flowwow", "доставка цветов и подарков"],
  "flor2u": ["флор2ю", "flor2u", "букеты цветов"],
  "farfor": ["фарфор", "farfor", "пицца и суши"],
  "tutu": ["туту", "tutu", "жд билеты", "авиабилеты"],
  "carte-blanche": ["карт бланш", "carte blanche"],
  "irnby": ["айрнби", "irnby", "ironby", "одежда"],
  "plati-po-miru": ["плати по миру", "зарубежные карты", "оплата сервисов"],
  "fmart": ["фмарт", "fmart"],
};

/**
 * Проверяет совпадение магазина с поисковым запросом с учётом нормализации,
 * раскладки клавиатуры и словаря псевдонимов.
 */
export function matchStoreSearch(
  store: { name: string; slug: string; category?: string },
  query: string
): boolean {
  if (!query) return true;
  const q = normalizeSearchTerm(query);
  if (!q) return true;

  const convertedQ = normalizeSearchTerm(convertKeyboardLayout(query));

  const storeName = normalizeSearchTerm(store.name);
  const storeSlug = normalizeSearchTerm(store.slug);
  const storeCat = normalizeSearchTerm(store.category || "");

  // 1. Прямое вхождение в имя, slug или категорию
  if (
    storeName.includes(q) ||
    storeSlug.includes(q) ||
    storeCat.includes(q)
  ) {
    return true;
  }

  // 2. Вхождение переключённой раскладки (например, «cfykfqn» -> «санлайт»)
  if (
    convertedQ &&
    (storeName.includes(convertedQ) ||
      storeSlug.includes(convertedQ) ||
      storeCat.includes(convertedQ))
  ) {
    return true;
  }

  // 3. Проверка словаря псевдонимов
  const aliases = STORE_ALIASES[store.slug] || [];
  for (const alias of aliases) {
    const normAlias = normalizeSearchTerm(alias);
    if (normAlias.includes(q) || q.includes(normAlias)) return true;
    if (convertedQ && (normAlias.includes(convertedQ) || convertedQ.includes(normAlias))) return true;
  }

  return false;
}
