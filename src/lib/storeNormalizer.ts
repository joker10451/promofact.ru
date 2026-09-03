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

  // Порядок важен: специфичное раньше общего. «Красота и здоровье» должна
  // уйти в косметику, а не в аптеку (обе содержат «здоров»), поэтому красота
  // проверяется до аптеки.
  if (/косметик|парфюм|крем|уход|волос|макияж|красот|космет|beauty|skin|care|davines|patch/i.test(t)) {
    return { name: "Косметика и парфюмерия", slug: "kosmetika-i-parfyumeriya" };
  }
  if (/аптек|витамин|\bбад\b|здоров|таблетк|лекарств|аптеч|farm|pharm|zdorov/i.test(t)) {
    return { name: "Аптека и здоровье", slug: "zdorove-i-vitaminy" };
  }
  if (/урок|курс|английск|образован|обучен|школ|репетитор|вебинар|тренинг|study|english|course|synergy/i.test(t)) {
    return { name: "Онлайн-образование", slug: "onlayn-obrazovanie" };
  }
  if (/ресторан|ролл|пицц|суши|бургер|блюд|вкусн|доставка\s+еды|food/i.test(t)) {
    return { name: "Доставка из ресторанов", slug: "dostavka-iz-restoranov" };
  }
  if (/продукт|супермаркет|пятёрочк|перекрест|магнит|\bлент|диет|бакалея|grocery|diet/i.test(t)) {
    return { name: "Доставка продуктов", slug: "dostavka-produktov" };
  }
  if (/дет(ск|и)|игрушк|малыш|коляск|памперс|подгузник|baby|kids/i.test(t)) {
    return { name: "Детские товары", slug: "detskie-tovary" };
  }
  if (/одежд|обув|вещ|мод(а|н)|плать|кроссовк|бель[её]|аксессуар|fashion|wear|clothes|shoes|irnby/i.test(t)) {
    return { name: "Одежда и обувь", slug: "odezhda-i-obuv" };
  }
  if (/книг|литератур|учебник|book/i.test(t)) {
    return { name: "Книги", slug: "knigi" };
  }
  if (/электрон|техник|гаджет|смартфон|ноутбук|телефон|компьютер|бытов|electronics|tech|gadget/i.test(t)) {
    return { name: "Электроника и техника", slug: "elektronika-i-tehnika" };
  }
  if (/авто(мобил|товар|запчаст|\b)|шин[аы]|запчаст|моторное|auto|\bcar\b/i.test(t)) {
    return { name: "Автотовары", slug: "avtotovary" };
  }
  if (/отел|гостиниц|билет|\bтур(изм|ы|\b)|поездк|путешеств|прокат|аренд|авиа|travel|hotel|otello/i.test(t)) {
    return { name: "Путешествия и туризм", slug: "puteshestviya-i-turizm" };
  }
  if (/фильм|сериал|кино|кинопоиск|cinema|movie/i.test(t)) {
    return { name: "Онлайн-кинотеатры", slug: "onlayn-kinoteatry" };
  }
  if (/цвет(ы|очн)|букет|флорист|flowers/i.test(t)) {
    return { name: "Цветы", slug: "tsvety" };
  }
  if (/мебел|уют|посуд|ремонт|интерьер|товары\s+для\s+дома|для\s+дома|home\s+goods|furniture/i.test(t)) {
    return { name: "Все для дома", slug: "vse-dlya-doma" };
  }
  if (/спорт|фитнес|тренировк|велосипед|sport|fitness/i.test(t)) {
    return { name: "Спорт и отдых", slug: "sport-i-otdyh" };
  }
  if (/впн|vpn|антивирус|\bсофт|подписк|стриминг|финанс|банк|кредит|страхов|сервис|pro32|service/i.test(t)) {
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
