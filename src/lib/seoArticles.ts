import type { Coupon, Store } from "@/lib/types";
import type { StoreInfo } from "@/lib/perfluence";

/* ---------- Утилиты для дат ---------- */

const MONTHS_NOM = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const MONTHS_GEN = [
  "января", "февраля", "марта", "апреля", "мая", "июня",
  "июля", "августа", "сентября", "октября", "ноября", "декабря",
];

const MONTHS_PREP = [
  "январе", "феврале", "марте", "апреле", "мае", "июне",
  "июле", "августе", "сентябре", "октябре", "ноябре", "декабре",
];

export function currentMonthYear(): string {
  const d = new Date();
  return `${MONTHS_NOM[d.getMonth()]} ${d.getFullYear()}`;
}

export function currentMonthGen(): string {
  const d = new Date();
  return `${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

export function currentMonthPrep(): string {
  const d = new Date();
  return `${MONTHS_PREP[d.getMonth()]} ${d.getFullYear()}`;
}

/* ---------- Подсчёт скидок ---------- */

export function getMaxDiscount(coupons: Coupon[]): string {
  let maxPercent = 0;
  let maxRub = 0;
  for (const c of coupons) {
    const text = c.promocode.bonusName || "";
    const p = text.match(/(\d+)\s*%/);
    if (p && Number(p[1]) > maxPercent) maxPercent = Number(p[1]);
    const r = text.match(/(\d[\s\d]*)\s*(?:₽|руб)/i);
    if (r) {
      const val = Number(r[1].replace(/\s+/g, ""));
      if (val > maxRub) maxRub = val;
    }
  }
  if (maxPercent > 0) return `до ${maxPercent}%`;
  if (maxRub > 0) return `до ${maxRub.toLocaleString("ru-RU")} ₽`;
  return "скидки";
}

function couponCountWord(n: number): string {
  if (n === 1) return "промокод";
  if (n >= 2 && n <= 4) return "промокода";
  return "промокодов";
}

/* ---------- Вводный текст статьи ---------- */

const INTRO_TEMPLATES = [
  (name: string, n: number, cw: string, disc: string, cat: string, monthGen: string) =>
    `Ищете промокоды ${name}? На ${monthGen} мы собрали ${n} ${cw} со скидкой ${disc}. Все коды проверены вручную и работают прямо сейчас — копируйте и применяйте при оформлении заказа.`,

  (name: string, n: number, cw: string, disc: string, cat: string, monthGen: string) =>
    `${name} — популярный магазин в категории «${cat}». Мы отслеживаем актуальные акции и собираем рабочие купоны в одном месте. Сейчас доступно ${n} ${cw} с выгодой ${disc}.`,

  (name: string, _n: number, _cw: string, disc: string, _cat: string, _monthGen: string) =>
    `Чтобы не переплачивать в ${name}, используйте промокоды из таблицы ниже. Максимальная скидка сейчас — ${disc}. Коды обновляются каждые 30 минут: истёкшие убираем, новые добавляем.`,

  (_name: string, _n: number, _cw: string, _disc: string, _cat: string, _monthGen: string) =>
    `Как применить промокод: скопируйте код из таблицы одной кнопкой, перейдите на сайт магазина по ссылке, добавьте товары в корзину и вставьте код в поле «Промокод» на этапе оплаты. Скидка применится сразу.`,
];

export function generateStoreIntro(store: StoreInfo): string[] {
  const n = store.coupons.length;
  const cw = couponCountWord(n);
  const disc = getMaxDiscount(store.coupons);
  const monthGen = currentMonthGen();

  return INTRO_TEMPLATES.map((tpl) =>
    tpl(store.name, n, cw, disc, store.category, monthGen)
  );
}

/* ---------- FAQ ---------- */

export interface FAQItem {
  question: string;
  answer: string;
}

export function generateStoreFAQ(store: StoreInfo): FAQItem[] {
  const n = store.coupons.length;
  const cw = couponCountWord(n);
  const disc = getMaxDiscount(store.coupons);
  const monthPrep = currentMonthPrep();
  const monthGen = currentMonthGen();

  const hitCoupons = store.coupons.filter((c) => c.promocode.isHit);
  const bestCode = hitCoupons.length > 0 ? hitCoupons[0].promocode.code : store.coupons[0]?.promocode.code;
  const bestBonus = hitCoupons.length > 0
    ? hitCoupons[0].promocode.bonusName
    : store.coupons[0]?.promocode.bonusName;

  const faq: FAQItem[] = [
    {
      question: `Сколько промокодов ${store.name} работает в ${monthPrep}?`,
      answer: `На ${monthGen} доступно ${n} ${cw} ${store.name} со скидкой ${disc}. Все коды проверены и обновляются каждые 30 минут.`,
    },
    {
      question: `Какая максимальная скидка ${store.name} сейчас?`,
      answer: `Максимальная скидка по промокоду ${store.name} — ${disc}. Скидки могут меняться, следите за обновлениями на странице.`,
    },
    {
      question: `Как применить промокод ${store.name}?`,
      answer: `Скопируйте промокод из таблицы, перейдите на сайт ${store.name}, добавьте товары в корзину и вставьте код в поле «Промокод» при оформлении заказа.`,
    },
  ];

  if (bestCode && bestBonus) {
    faq.push({
      question: `Какой лучший промокод ${store.name} сейчас?`,
      answer: `Лучший промокод сейчас — ${bestCode} (${bestBonus}). Проверен и работает на момент публикации.`,
    });
  }

  if (store.coupons.some((c) => c.promocode.isFirstOrderOnly)) {
    faq.push({
      question: `Есть ли промокоды ${store.name} для первого заказа?`,
      answer: `Да, в нашей подборке есть специальные промокоды для новых клиентов ${store.name}. Они отмечены пометкой «Первый заказ».`,
    });
  }

  return faq;
}

/* ---------- Данные таблицы промокодов ---------- */

export interface PromoTableRow {
  code: string;
  bonus: string;
  terms: string;
  expires: string;
  isHit: boolean;
  isFirstOrder: boolean;
  affiliateLink: string;
  storeSlug: string;
}

export function generatePromoTable(coupons: Coupon[]): PromoTableRow[] {
  return coupons.map((c) => {
    const expires = c.promocode.expires
      ? new Date(c.promocode.expires).toLocaleDateString("ru-RU", {
          day: "numeric",
          month: "long",
        })
      : "Бессрочно";

    return {
      code: c.promocode.code,
      bonus: c.promocode.bonusName || "Скидка",
      terms: c.promocode.terms || "Без ограничений",
      expires,
      isHit: c.promocode.isHit,
      isFirstOrder: c.promocode.isFirstOrderOnly,
      affiliateLink: c.affiliate.link,
      storeSlug: c.store.slug,
    };
  });
}

/* ---------- SEO мета ---------- */

export function generateSEOMeta(store: StoreInfo) {
  const n = store.coupons.length;
  const cw = couponCountWord(n);
  const disc = getMaxDiscount(store.coupons);
  const monthYear = currentMonthYear();
  const monthGen = currentMonthGen();

  const title = `Все промокоды ${store.name} на ${monthYear} — ${disc} (${n} ${cw})`;
  const description =
    `Рабочие промокоды и купоны ${store.name} на ${monthGen}: ${n} проверенных ${cw} со скидкой ${disc}. ` +
    `Таблица кодов, инструкция и FAQ. Обновлено сегодня.`;

  return { title, description };
}
