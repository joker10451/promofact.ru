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

// Транслитерация кириллицы в латиницу (для фонетического поиска: «рутуб» -> «rutub»)
const RU_TO_LATIN: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i",
  й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t",
  у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y",
  ь: "", э: "e", ю: "yu", я: "ya",
};

/**
 * Фонетическая транслитерация кириллицы в латиницу («рутуб» -> «rutub», «делимобиль» -> «delimobil»).
 */
export function transliterateRuToEn(str: string): string {
  if (!str) return "";
  const lower = str.toLowerCase();
  let result = "";
  for (const ch of lower) {
    result += RU_TO_LATIN[ch] !== undefined ? RU_TO_LATIN[ch] : ch;
  }
  return result;
}

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
  "premier": ["премьер", "premier", "премьер тв", "онлайн кинотеатр", "сериалы", "фильмы"],
  "rutube": ["рутуб", "рутьюб", "рутубе", "rutube", "видеохостинг", "видео", "рутуб премиум"],
  "otello": ["отелло", "otello", "бронирование отелей", "гостиницы"],
  "t-puteshestviya-oteli": ["т-путешествия", "т путешествия", "тинькофф путешествия", "t-travel", "t-puteshestviya", "бронирование отелей", "гостиницы тинькофф"],
  "ostrovok": ["островок", "островок ру", "ostrovok", "ostrovok ru", "бронирование отелей", "гостиницы", "отели по россии", "отели по миру"],
  "sberzdorovie": ["сберздоровье", "сбер здоровье", "sberhealth", "врач онлайн", "телемедицина", "сбер аптека", "консультация врача"],
  "magnit-dostavka": ["магнит доставка", "магнит", "magnit", "доставка магнит"],
  "magnit-plyus-premium": ["магнит плюс", "магнит премиум", "magnit plus"],
  "m-kosmetik": ["м косметик", "магнит косметик", "m kosmetik"],
  "letual": ["лэтуаль", "летуаль", "letual", "letoile", "парфюмерия", "косметика"],
  "vazhnaya-ryba": ["важная рыба", "суши", "роллы", "рыба"],
  "tanukifamily": ["тануки", "tanuki", "японская кухня", "суши"],
  "dodo-pizza": ["додо", "додо пицца", "dodo", "пицца"],
  "ebidoebi": ["ебидоеби", "ёбидоёби", "суши"],
  "vkusvill-dostavka": ["вкусвилл", "vkusvill", "вкус вилл", "правильное питание"],
  "perekrestok-dostavka": ["перекресток", "перекрёсток", "perekrestok", "доставка продуктов"],
  "sberprime": ["сберпрайм", "сбер прайм", "sberprime", "сбер", "подписка сберпрайм"],
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
  "delimobil": ["делимобиль", "delimobil", "делик", "каршеринг", "аренда авто", "прокат авто"],
  "citydrive": ["ситидрайв", "сити драйв", "ситимобил", "citydrive", "каршеринг", "аренда авто"],
  "cozy-home": ["кози хоум", "козихоум", "кози хом", "кози", "cozy home", "постельное белье", "текстиль", "товары для дома"],
  "elementaree": ["элементари", "элементарее", "elementaree", "наборы еды", "конструктор еды", "доставка продуктов", "ужины"],
  "geltek": ["гельтек", "гельтек медика", "geltek", "косметика", "уход за кожей", "диагностика кожи"],
  "poizon": ["пойзон", "пойзон бокс", "пойзонбокс", "poizon", "poizon box", "дэву", "кроссовки", "обувь", "брендовые вещи"],
  "carely": ["керли", "кейрли", "карли", "carely", "косметика", "уход"],
  "mark-formelle": ["марк формель", "маркформель", "марк формел", "mark formelle", "трикотаж", "белье", "одежда"],
  "yandex-plus": ["яндекс плюс", "яндексплюс", "yandex plus", "плюс", "подписка плюс", "баллы плюс"],
  "yandex-eda-gipermarkety": ["яндекс еда гипермаркеты", "гипермаркеты", "яндекс еда магазины", "yandex eda gipermarkety", "доставка продуктов"],
  "avito-puteshestviya": ["авито путешествия", "авито", "avito", "авито отели", "авито жилье", "посуточно", "аренда квартир"],
  "t-bank-junior": ["т-банк джуниор", "т банк джуниор", "тинькофф джуниор", "t-bank junior", "детская карта", "тбанк", "тинькофф", "джуниор"],
  "winlab": ["винлаб", "вин лаб", "winlab", "вино", "напитки", "алкоголь"],
  "podruzhka": ["подружка", "podruzhka", "косметика", "парфюмерия"],
  "megamarket": ["мегамаркет", "сбермегамаркет", "megamarket", "маркетплейс"],
};

/**
 * Проверяет совпадение магазина с поисковым запросом с учётом нормализации,
 * раскладки клавиатуры, фонетической транслитерации и словаря псевдонимов.
 */
export function matchStoreSearch(
  store: { name: string; slug: string; category?: string },
  query: string
): boolean {
  if (!query) return true;
  const q = normalizeSearchTerm(query);
  if (!q) return true;

  const convertedQ = normalizeSearchTerm(convertKeyboardLayout(query));
  const translitQ = normalizeSearchTerm(transliterateRuToEn(query));

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

  // 3. Фонетическая транслитерация («рутуб» -> «rutub» для «rutube»)
  if (
    translitQ && translitQ.length >= 3 &&
    (storeSlug.includes(translitQ) || storeName.includes(translitQ))
  ) {
    return true;
  }

  // 4. Проверка словаря псевдонимов
  let aliases = STORE_ALIASES[store.slug] || [];

  // Если slug пустой или по нему нет алиасов, пытаемся найти алиасы по имени магазина
  if (aliases.length === 0 && storeName) {
    for (const [key, aliasList] of Object.entries(STORE_ALIASES)) {
      if (
        key === storeName ||
        aliasList.some((a) => normalizeSearchTerm(a) === storeName)
      ) {
        aliases = aliasList;
        break;
      }
    }
  }

  for (const alias of aliases) {
    const normAlias = normalizeSearchTerm(alias);
    if (!normAlias) continue;
    if (normAlias.includes(q) || q.includes(normAlias)) return true;
    if (convertedQ && (normAlias.includes(convertedQ) || convertedQ.includes(normAlias))) return true;
    if (translitQ && translitQ.length >= 3 && (normAlias.includes(translitQ) || translitQ.includes(normAlias))) return true;
  }

  return false;
}
