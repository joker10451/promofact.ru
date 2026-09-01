import "server-only";
import { translit } from "@/lib/translit";
import { normalizeStore } from "@/lib/storeNormalizer";
import type { Coupon, Store, Promocode, Affiliate } from "@/lib/types";

const DEFAULT_ADMITAD_XML_URL =
  "https://export.admitad.com/ru/webmaster/websites/2990501/coupons/export/?code=jdskmibwva&user=ilia_pisklov6ed68&region=00&format=xml&v=1";

const ADMITAD_FEED_URL = process.env.ADMITAD_FEED_URL || DEFAULT_ADMITAD_XML_URL;

export function isAdmitadConfigured(): boolean {
  return Boolean(ADMITAD_FEED_URL);
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function stripHtml(v: unknown): string {
  return str(v)
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Категории Admitad маппим в понятные русские категории ПромоФакта
 */
const CATEGORY_MAP: Record<string, string> = {
  "18": "Сервисы и подписки",
  "62": "Маркетплейсы",
  "64": "Одежда и обувь",
  "65": "Бытовая техника и электроника",
  "66": "Все для дома",
  "67": "Косметика и парфюмерия",
  "69": "Детские товары",
  "72": "Цветы и подарки",
  "85": "Спорт и отдых",
  "89": "Хобби и канцтовары",
  "92": "Автотовары",
  "93": "Сервисы и подписки",
  "96": "Маркетплейсы",
  "98": "Онлайн-образование",
  "102": "Продукты и доставка",
  "122": "Сервисы и подписки",
  "257": "Сервисы и подписки",
  "382": "Маркетплейсы",
};

/**
 * Проверка на иностранный спам (испанский, итальянский, турецкий, португальский и пустые дампы)
 */
function isForeignJunk(name: string, terms: string): boolean {
  const text = `${name} ${terms}`.toLowerCase();
  if (
    /artículo|sconti|descuento|hasta\s+\d|dernières|tendances|vendedores|varan\s+indirimler|super\s+ofertas|choice\s*-\s*3|us\s+new\s+user|us\s+warehouse|do\s+brasil|articoli\s+per|best\s+aliexpress/i.test(
      text,
    )
  ) {
    return true;
  }
  // Если в названии вообще нет ни одной русской буквы и нет конкретного промокода
  const hasCyrillic = /[а-яё]/i.test(text);
  const isEnglishOnly = !hasCyrillic;
  if (isEnglishOnly && text.length < 15) return true;

  return false;
}

/**
 * Парсинг XML выгрузки Admitad Coupons & Deals
 */
export function parseAdmitadXml(xml: string): Coupon[] {
  try {
    // 1. Извлекаем рекламодателей
    const campaigns = new Map<
      string,
      { name: string; site: string; categoryId: string }
    >();
    const campRegex = /<advcampaign id="(\d+)">([\s\S]*?)<\/advcampaign>/g;
    let match: RegExpExecArray | null;

    while ((match = campRegex.exec(xml)) !== null) {
      const id = match[1];
      const body = match[2];
      const name = (body.match(/<name>(.*?)<\/name>/) || [])[1] || "";
      const site = (body.match(/<site>(.*?)<\/site>/) || [])[1] || "";
      const catMatch = body.match(/<category_id>(\d+)<\/category_id>/);
      const categoryId = catMatch ? catMatch[1] : "62";
      campaigns.set(id, {
        name: stripHtml(name),
        site: stripHtml(site),
        categoryId,
      });
    }

    // 2. Извлекаем купоны
    const coupons: Coupon[] = [];
    const seenCodes = new Set<string>();
    const storeCount = new Map<string, number>();
    const coupRegex = /<coupon id="(\d+)">([\s\S]*?)<\/coupon>/g;

    while ((match = coupRegex.exec(xml)) !== null) {
      const id = parseInt(match[1], 10);
      const body = match[2];
      const name = (body.match(/<name>(.*?)<\/name>/) || [])[1] || "";
      const campId =
        (body.match(/<advcampaign_id>(.*?)<\/advcampaign_id>/) || [])[1] || "";
      const logo = (body.match(/<logo>(.*?)<\/logo>/) || [])[1] || "";
      const promocode =
        (body.match(/<promocode>(.*?)<\/promocode>/) || [])[1] || "";
      const gotolink =
        (body.match(/<gotolink>(.*?)<\/gotolink>/) || [])[1] || "";
      const dateEnd =
        (body.match(/<date_end>(.*?)<\/date_end>/) || [])[1] || "";
      const discount =
        (body.match(/<discount>(.*?)<\/discount>/) || [])[1] || "";
      const customerType =
        (body.match(/<customer_type>(.*?)<\/customer_type>/) || [])[1] || "";
      const terms =
        (body.match(/<description>(.*?)<\/description>/) || [])[1] || "";

      const cleanPromo =
        promocode.trim() === "Not required" ? "" : promocode.trim();
      const cleanName = stripHtml(name);
      const cleanTerms = stripHtml(terms);

      // Фильтруем иностранный мусор и дампы без промокода
      if (isForeignJunk(cleanName, cleanTerms)) {
        continue;
      }

      const camp = campaigns.get(campId) || {
        name: "Магазин",
        site: "",
        categoryId: "62",
      };

      const rawStoreName = camp.name || "Магазин";
      const rawStoreSlug = translit(rawStoreName) || "magazin";
      const norm = normalizeStore(rawStoreName, rawStoreSlug, CATEGORY_MAP[camp.categoryId]);

      const storeName = norm.name;
      const storeSlug = rawStoreSlug;
      const categoryName = norm.category;
      const categorySlug = norm.categorySlug;

      // Ограничиваем количество предложений от одного зарубежного магазина (макс 3)
      const currentStoreCoupons = storeCount.get(storeSlug) || 0;
      if ((storeSlug.includes("aliexpress") || storeSlug.includes("alibaba")) && currentStoreCoupons >= 2) {
        continue;
      }
      storeCount.set(storeSlug, currentStoreCoupons + 1);

      // Извлечение erid из gotolink
      const eridMatch = gotolink.match(/erid=([a-zA-Z0-9_-]+)/);
      const erid = eridMatch ? eridMatch[1] : "";

      let bonusName = cleanName;
      if (discount && !cleanName.includes(discount)) {
        bonusName = `${cleanName} (скидка ${discount})`;
      }

      // Форматирование даты окончания
      let expires: string | null = null;
      if (dateEnd && dateEnd !== "None") {
        const d = dateEnd.slice(0, 10);
        if (/^\d{4}-\d{2}-\d{2}$/.test(d)) {
          expires = d;
        }
      }

      const store: Store = {
        id: 90000 + (parseInt(campId, 10) || id % 10000),
        name: storeName,
        slug: storeSlug,
        logo: logo || null,
        category: categoryName,
        categorySlug: categorySlug,
        about: `${storeName} — официальный магазин-партнёр. Актуальные скидки и промокоды.`,
        conditions: "Скидка применяется при переходе по ссылке и вводе промокода.",
        site: camp.site || gotolink,
        activeBloggers: 500,
      };

      const affiliate: Affiliate = {
        link: gotolink.replace(/&amp;/g, "&"),
        landingLink: gotolink.replace(/&amp;/g, "&"),
        ordMarker: erid,
        ordText: erid ? `Реклама. ${storeName}, erid: ${erid}` : `Реклама. ${storeName}`,
      };

      const promoObj: Promocode = {
        id,
        code: cleanPromo,
        bonusName,
        terms: cleanTerms || cleanName,
        expires,
        isHit: Boolean(discount && (discount.includes("50%") || discount.includes("40%") || discount.includes("30%"))),
        isUniversal: true,
        isFirstOrderOnly: customerType.includes("new") || /перв/i.test(cleanName),
        region: "RU",
        isBarcode: false,
        barcodeImage: null,
        group: "admitad",
      };

      const dedupeKey = `${storeSlug}-${cleanPromo || id}`;
      if (!seenCodes.has(dedupeKey)) {
        seenCodes.add(dedupeKey);
        coupons.push({
          id,
          promocode: promoObj,
          store,
          affiliate,
          extraLinks: [],
        });
      }
    }

    return coupons;
  } catch (e) {
    console.error("[admitad] Ошибка парсинга XML Admitad:", e);
    return [];
  }
}

let admitadCache: Coupon[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 15 * 60 * 1000; // 15 минут

export async function fetchAdmitadCoupons(): Promise<Coupon[]> {
  if (!isAdmitadConfigured()) return [];

  const now = Date.now();
  if (admitadCache && now - lastFetchTime < CACHE_TTL_MS) {
    return admitadCache;
  }

  try {
    const res = await fetch(ADMITAD_FEED_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "application/xml,text/xml,*/*",
      },
      next: { revalidate: 1800 },
    });

    if (!res.ok) {
      console.warn(`[admitad] Не удалось загрузить фид: ${res.status} ${res.statusText}`);
      return admitadCache || [];
    }

    const text = await res.text();
    const list = parseAdmitadXml(text);
    console.log(`[admitad] Успешно загружено купонов после фильтрации качества: ${list.length}`);
    admitadCache = list;
    lastFetchTime = now;
    return list;
  } catch (e) {
    console.error("[admitad] Ошибка запроса к фиду Admitad:", e);
    return admitadCache || [];
  }
}
