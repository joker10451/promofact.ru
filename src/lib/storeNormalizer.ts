/**
 * Модуль нормализации магазинов и категоризации
 * Превращает сырые технические данные сетей (Admitad, Saleads, Perfluence)
 * в чистый, премиальный продуктовый каталог.
 */

interface NormalizedStoreMeta {
  name: string;
  category: string;
  categorySlug: string;
}

const STORE_OVERRIDES: Record<string, NormalizedStoreMeta> = {
  "patch-and-go": {
    name: "Patch & Go",
    category: "Косметика и парфюмерия",
    categorySlug: "kosmetika-i-parfyumeriya",
  },
  "pro32-com": {
    name: "PRO32",
    category: "Сервисы и подписки",
    categorySlug: "servisy-i-podpiski",
  },
  "itab-ru": {
    name: "iTab",
    category: "Здоровье и витамины",
    categorySlug: "zdorove-i-vitaminy",
  },
  "polzaru": {
    name: "Польза.ru",
    category: "Аптека и здоровье",
    categorySlug: "zdorove-i-vitaminy",
  },
  "sinergiya-angliyskiy": {
    name: "Синергия Английский",
    category: "Онлайн-образование",
    categorySlug: "onlayn-obrazovanie",
  },
  "applicantally-ww": {
    name: "ApplicantAlly",
    category: "Сервисы и подписки",
    categorySlug: "servisy-i-podpiski",
  },
  "davines": {
    name: "Davines",
    category: "Косметика и парфюмерия",
    categorySlug: "kosmetika-i-parfyumeriya",
  },
  "indiwd": {
    name: "Indiwd",
    category: "Одежда и обувь",
    categorySlug: "odezhda-i-obuv",
  },
  "irnby": {
    name: "IRNBY",
    category: "Одежда и обувь",
    categorySlug: "odezhda-i-obuv",
  },
  "yamdiet": {
    name: "YamDiet",
    category: "Доставка продуктов",
    categorySlug: "dostavka-produktov",
  },
  "yandeks-prokat-ru": {
    name: "Яндекс Прокат",
    category: "Путешествия и туризм",
    categorySlug: "puteshestviya-i-turizm",
  },
  "aliexpress-ww": {
    name: "AliExpress",
    category: "Маркетплейсы",
    categorySlug: "marketpleysy",
  },
  "alibaba-ww": {
    name: "Alibaba",
    category: "Маркетплейсы",
    categorySlug: "marketpleysy",
  },
  "noon-ae-sa-eg-offline-codes": {
    name: "Noon",
    category: "Все для дома",
    categorySlug: "vse-dlya-doma",
  },
  "sitpack-ww": {
    name: "Sitpack",
    category: "Спорт и отдых",
    categorySlug: "sport-i-otdyh",
  },
  "openhagen-ww": {
    name: "OpenHagen",
    category: "Все для дома",
    categorySlug: "vse-dlya-doma",
  },
  "fmart-by-flowwow": {
    name: "FMART",
    category: "Цветы",
    categorySlug: "tsvety",
  },
  "yandeks-tsvety": {
    name: "Яндекс Цветы",
    category: "Цветы",
    categorySlug: "tsvety",
  },
  "otello": {
    name: "Отелло",
    category: "Путешествия и туризм",
    categorySlug: "puteshestviya-i-turizm",
  },
  "kinopoisk": {
    name: "Кинопоиск",
    category: "Онлайн-кинотеатры",
    categorySlug: "onlayn-kinoteatry",
  },
  "pyaterochka": {
    name: "Пятёрочка",
    category: "Доставка продуктов",
    categorySlug: "dostavka-produktov",
  },
  "vazhnaya-ryba": {
    name: "Важная Рыба",
    category: "Доставка из ресторанов",
    categorySlug: "dostavka-iz-restoranov",
  },
  "fix-price": {
    name: "Fix Price",
    category: "Все для дома",
    categorySlug: "vse-dlya-doma",
  },
  "plati-po-miru": {
    name: "Плати по миру",
    category: "Сервисы и подписки",
    categorySlug: "servisy-i-podpiski",
  },
  "fmart": {
    name: "FMART",
    category: "Цветы",
    categorySlug: "tsvety",
  },
  "yandeks-puteshestviya": {
    name: "Яндекс Путешествия",
    category: "Путешествия и туризм",
    categorySlug: "puteshestviya-i-turizm",
  },
  "yandex-travel": {
    name: "Яндекс Путешествия",
    category: "Путешествия и туризм",
    categorySlug: "puteshestviya-i-turizm",
  },
  "sberprime": {
    name: "СберПрайм",
    category: "Сервисы и подписки",
    categorySlug: "servisy-i-podpiski",
  },
  "agni": {
    name: "Agni",
    category: "Все для дома",
    categorySlug: "vse-dlya-doma",
  },
};

/**
 * Определение категории по смысловым ключевым словам
 */
export function inferCategory(text: string): { name: string; slug: string } {
  const t = text.toLowerCase();

  if (/аптек|витамин|бад|здоров|таблетк|лекарств|farm|zdorov/i.test(t)) {
    return { name: "Аптека и здоровье", slug: "zdorove-i-vitaminy" };
  }
  if (/косметик|парфюм|крем|уход|волос|макияж|beauty|skin|care|davines|patch/i.test(t)) {
    return { name: "Косметика и парфюмерия", slug: "kosmetika-i-parfyumeriya" };
  }
  if (/урок|курс|английск|образован|обучен|школ|репетитор|study|english|synergy/i.test(t)) {
    return { name: "Онлайн-образование", slug: "onlayn-obrazovanie" };
  }
  if (/ресторан|ролл|пицц|суши|бургер|еда|блюд|вкусн|рыб/i.test(t)) {
    return { name: "Доставка из ресторанов", slug: "dostavka-iz-restoranov" };
  }
  if (/продукт|супермаркет|пятёрочк|перекресток|магнит|лент|диет|diet/i.test(t)) {
    return { name: "Доставка продуктов", slug: "dostavka-produktov" };
  }
  if (/одел|одежд|обув|вещ|мод|плать|кроссовк|fashion|wear|clothes|irnby/i.test(t)) {
    return { name: "Одежда и обувь", slug: "odezhda-i-obuv" };
  }
  if (/отел|гостиниц|билет|тур|поездк|прокат|аренд|travel|hotel|otello/i.test(t)) {
    return { name: "Путешествия и туризм", slug: "puteshestviya-i-turizm" };
  }
  if (/фильм|сериал|кино|кинопоиск|подписк|cinema|movie/i.test(t)) {
    return { name: "Онлайн-кинотеатры", slug: "onlayn-kinoteatry" };
  }
  if (/цвет|букет|флорист|подар|flowers/i.test(t)) {
    return { name: "Цветы", slug: "tsvety" };
  }
  if (/дом|мебел|уют|посуд|ремонт|интерьер|home|fix/i.test(t)) {
    return { name: "Все для дома", slug: "vse-dlya-doma" };
  }
  if (/спорт|фитнес|тренировк|sport/i.test(t)) {
    return { name: "Спорт и отдых", slug: "sport-i-otdyh" };
  }
  if (/впн|vpn|антивирус|софт|карт|подписк|сервис|pro32/i.test(t)) {
    return { name: "Сервисы и подписки", slug: "servisy-i-podpiski" };
  }

  return { name: "Маркетплейсы", slug: "marketpleysy" };
}

/**
 * Нормализация мета-данных магазина
 */
export function normalizeStore(rawName: string, rawSlug: string, rawCat?: string): NormalizedStoreMeta {
  const slug = rawSlug.toLowerCase().trim();
  if (STORE_OVERRIDES[slug]) {
    return STORE_OVERRIDES[slug];
  }

  // Очистка названия магазина от мусора (.com, RU, WW, etc.)
  let cleanName = rawName
    .replace(/\s+(WW|RU|BY|KZ|AE|SA|EG|offline\s+codes)$/i, "")
    .replace(/\.(com|ru|io|by|net)$/i, "")
    .replace(/^fmart\s+by\s+flowwow$/i, "FMART")
    .replace(/^patch\s+and\s+go$/i, "Patch & Go")
    .replace(/^itab$/i, "iTab")
    .trim();

  // Приведение первой буквы к верхнему регистру
  if (cleanName.length > 0 && cleanName[0] === cleanName[0].toLowerCase()) {
    cleanName = cleanName[0].toUpperCase() + cleanName.slice(1);
  }

  const inferred = inferCategory(`${cleanName} ${rawCat || ""}`);

  return {
    name: cleanName || rawName,
    category: inferred.name,
    categorySlug: inferred.slug,
  };
}
