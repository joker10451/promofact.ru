import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import JsonLd from "@/components/JsonLd";
import SberStickyCta from "@/components/SberStickyCta";
import SberSavingsCalc from "@/components/SberSavingsCalc";
import {
  IconCalendar,
  IconCard,
  IconGift,
  IconZero,
  IconShield,
  IconLicense,
  IconBolt,
} from "@/components/SberIcons";
import { SITE_NAME, SITE_URL, CHANNELS } from "@/lib/site";

const BASE_URL = "https://sberbank1.prfl.me/sites/lccq8a?erid=2RanynFCKB1";
const AFFILIATE_URL = `${BASE_URL}&utm_source=promofact&utm_medium=landing&utm_campaign=sbercard`;

export const revalidate = 86400;

export async function generateMetadata(): Promise<Metadata> {
  const url = `${SITE_URL}/sberkarta`;
  const title =
    "СберКарта кредитная: оформить онлайн с доставкой сегодня — до 120 дней без процентов";
  const description =
    "Кредитная СберКарта: до 120 дней без процентов, лимит до 1 млн ₽, кешбэк до 30% у партнёров и 0₽ за обслуживание. Оформите онлайн — доставка карты уже сегодня.";
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      locale: "ru_RU",
      siteName: SITE_NAME,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

const benefits = [
  {
    icon: <IconCalendar />,
    title: "До 120 дней без процентов",
    text: "Грейс-период на покупки: оплачивайте в рамках льготного периода и не платите проценты за пользование. Беспроцентная рассрочка на 4 месяца.",
  },
  {
    icon: <IconCard />,
    title: "Лимит до 1 млн ₽",
    text: "Достаточно на крупные покупки и повседневные расходы. Решение по лимиту принимает банк индивидуально.",
  },
  {
    icon: <IconGift />,
    title: "До 30% кешбэк у партнёров",
    text: "Возврат на карту за покупки у партнёров Сбера и в популярных категориях — от кафе до маркетплейсов.",
  },
  {
    icon: <IconZero />,
    title: "0₽ за обслуживание",
    text: "Нет абонентской платы за пользование картой. Платите только за пользование кредитом вне льготного периода.",
  },
];

const faq = [
  {
    q: "Что такое льготный период 120 дней?",
    a: "Это время, за которое нужно вернуть потраченные деньги, чтобы не платить проценты. Если закрыть задолженность внутри периода — переплата равна нулю.",
  },
  {
    q: "Нужно ли идти в отделение банка?",
    a: "Нет. Карту можно оформить онлайн по ссылке — доставка курьером возможна уже в день заявки в ряде регионов.",
  },
  {
    q: "Сколько стоит обслуживание?",
    a: "0₽ в месяц за саму карту. Проценты начисляются только если не закрыть долг в льготный период — по ставке, указанной в договоре.",
  },
  {
    q: "Кому одобрят карту?",
    a: "Решение принимает банк на основе скоринга: возраст, доход, кредитная история. Заявку можно подать с 18 лет.",
  },
  {
    q: "Что будет, если не закрыть долг вовремя?",
    a: "На сумму сверх льготного периода начислятся проценты по ставке договора (49,8–59,8% годовых). Поэтому картой выгодно пользоваться именно в рамках 120 дней.",
  },
];

export default function SberCardPage() {
  const url = `${SITE_URL}/sberkarta`;

  const productJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Кредитная СберКарта",
    description:
      "Кредитная карта Сбера: до 120 дней без процентов, лимит до 1 млн ₽, кешбэк до 30% у партнёров, обслуживание 0₽.",
    brand: { "@type": "Brand", name: "Сбер" },
    offers: {
      "@type": "Offer",
      priceCurrency: "RUB",
      price: 0,
      availability: "https://schema.org/InStock",
      url: BASE_URL,
      seller: { "@type": "Organization", name: "ПАО Сбербанк" },
    },
  };

  const breadcrumbJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Главная", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Кэшбэк банков 2026",
        item: `${SITE_URL}/sovety/cashbek-bankov-2026`,
      },
      { "@type": "ListItem", position: 3, name: "СберКарта", item: url },
    ],
  };

  const faqJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const proofStats = [
    { value: "120", label: "дней без %" },
    { value: "1 млн ₽", label: "лимит" },
    { value: "30%", label: "кешбэк" },
    { value: "0 ₽", label: "обслуживание" },
  ];

  return (
    <main className="min-h-screen bg-paper pb-28">
      <JsonLd data={productJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />

      <div className="mx-auto max-w-5xl px-4 pt-8 sm:px-6">
        <nav
          aria-label="Хлебные крошки"
          className="text-xs font-semibold text-ink/45"
        >
          <Link href="/" className="hover:text-ink transition-colors">
            Главная
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <Link
            href="/sovety/cashbek-bankov-2026"
            className="hover:text-ink transition-colors"
          >
            Кэшбэк банков 2026
          </Link>
          <span className="mx-2" aria-hidden="true">
            /
          </span>
          <span aria-current="page">СберКарта</span>
        </nav>

        {/* HERO */}
        <section className="mt-6 relative overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white to-mint/20 p-6 shadow-[0_4px_0_rgba(11,16,43,0.06)] sm:p-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-red/10 px-3 py-1 text-xs font-bold text-red">
            🔥 Финансовый запас на каждый день
          </span>
          <h1 className="mt-4 font-display text-3xl font-black leading-tight text-ink sm:text-4xl lg:text-5xl">
            Кредитная СберКарта
          </h1>
          <p className="mt-2 font-display text-xl font-extrabold text-red sm:text-2xl">
            120 дней уверенности в завтрашнем дне
          </p>
          <p className="mt-3 max-w-2xl text-base font-medium text-ink/70 sm:text-lg">
            Покупайте сейчас, платите потом — и не отдавайте банку ни копейки
            процентов целых 4 месяца. Лимит до 1 млн ₽, кешбэк до 30% и
            обслуживание 0₽.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="nofollow noopener sponsored"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red px-7 py-4 text-base font-extrabold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
            >
              Оформить СберКарту →
            </a>
            <span className="text-sm font-semibold text-ink/50">
              Доставка карты уже сегодня
            </span>
          </div>

          {/* Социальное доказательство / статистика */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {proofStats.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-line bg-white/70 px-3 py-3 text-center"
              >
                <div className="font-display text-2xl font-black text-ink sm:text-3xl">
                  {s.value}
                </div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wide text-ink/50">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* КАЛЬКУЛЯТОР ВЫГОДЫ */}
        <section className="mt-10">
          <SberSavingsCalc affiliateUrl={AFFILIATE_URL} />
        </section>

        {/* CAMPAIGN BANNER */}
        <Image
          src="/sberkarta-banner.webp"
          alt="Кредитная СберКарта — 120 дней уверенности в завтрашнем дне"
          width={2100}
          height={1500}
          loading="lazy"
          className="mt-10 w-full rounded-3xl border border-line shadow-[0_4px_0_rgba(11,16,43,0.06)]"
        />

        {/* BENEFITS */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-extrabold text-ink">
            Почему СберКарта — это выгодно
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="group rounded-2xl border border-line bg-white p-5 transition-all hover:border-mint hover:shadow-[0_10px_30px_-12px_rgba(22,199,132,0.35)]"
              >
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red/10 to-mint/10 text-red transition-transform group-hover:scale-110">
                  {b.icon}
                </div>
                <h3 className="mt-3 font-display text-lg font-extrabold text-ink">
                  {b.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/65">
                  {b.text}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ПРИМЕР КОНКРЕТНОЙ ПОКУПКИ (снятие возражений) */}
        <section className="mt-10 rounded-3xl border border-line bg-white p-6 shadow-[0_4px_0_rgba(11,16,43,0.06)] sm:p-8">
          <h2 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
            Пример: холодильник за 60 000 ₽
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-2xl bg-paper p-4">
              <div className="text-sm font-bold text-ink/60">Без карты</div>
              <div className="mt-1 font-mono text-lg font-black text-ink">
                60 000 ₽ сразу
              </div>
              <p className="mt-2 text-xs text-ink/50">
                Отдаёте всю сумму из бюджета одним платежом.
              </p>
            </div>
            <div className="rounded-2xl bg-mint/10 p-4">
              <div className="text-sm font-bold text-ink/60">
                СберКарта, 120 дней
              </div>
              <div className="mt-1 font-mono text-lg font-black text-mint">
                0 ₽ процентов
              </div>
              <p className="mt-2 text-xs text-ink/50">
                Делите 60 000 на 4 месяца, проценты не капают.
              </p>
            </div>
            <div className="rounded-2xl bg-red/5 p-4">
              <div className="text-sm font-bold text-ink/60">Плюс кешбэк</div>
              <div className="mt-1 font-mono text-lg font-black text-red">
                до +18 000 ₽
              </div>
              <p className="mt-2 text-xs text-ink/50">
                Вернётся на карту, если магазин — партнёр.
              </p>
            </div>
          </div>
          <a
            href={AFFILIATE_URL}
            target="_blank"
            rel="nofollow noopener sponsored"
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink px-8 py-4 text-base font-extrabold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
          >
            Оформить Кредитную СберКарту
          </a>
        </section>

        {/* ДОВЕРИЕ / БЕЗОПАСНОСТЬ */}
        <section className="mt-10 grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-line bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(11,16,43,0.25)]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red/10 to-mint/10 text-red">
              <IconShield />
            </div>
            <h3 className="mt-2 font-bold text-ink">Данные под защитой</h3>
            <p className="mt-1 text-xs text-ink/55">
              Оформление на официальном сайте банка с шифрованием.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(11,16,43,0.25)]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red/10 to-mint/10 text-red">
              <IconLicense />
            </div>
            <h3 className="mt-2 font-bold text-ink">Лицензия ЦБ РФ</h3>
            <p className="mt-1 text-xs text-ink/55">
              №1481 от 11.08.2015 — ПАО Сбербанк.
            </p>
          </div>
          <div className="rounded-2xl border border-line bg-white p-5 text-center transition-all hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(11,16,43,0.25)]">
            <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-red/10 to-mint/10 text-red">
              <IconBolt />
            </div>
            <h3 className="mt-2 font-bold text-ink">Решение за 2 минуты</h3>
            <p className="mt-1 text-xs text-ink/55">
              Заявка онлайн, без справок о доходах.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="mt-10">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Частые вопросы
          </h2>
          <div className="mt-5 space-y-3">
            {faq.map((f) => (
              <details
                key={f.q}
                className="group rounded-2xl border border-line bg-white px-5 py-4"
              >
                <summary className="cursor-pointer list-none font-bold text-ink">
                  {f.q}
                  <span className="float-right text-red group-open:hidden">+</span>
                  <span className="float-right text-red hidden group-open:inline">
                    −
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* RELATED + CHANNELS */}
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-line bg-white p-6">
            <h2 className="font-display text-lg font-extrabold text-ink">
              Полезные материалы
            </h2>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/sovety/cashbek-bankov-2026"
                  className="font-semibold text-ink underline underline-offset-2 hover:text-red"
                >
                  Кэшбэк банков 2026: как вернуть до 10%
                </Link>
              </li>
              <li>
                <Link
                  href="/category/servisy-i-podpiski"
                  className="font-semibold text-ink underline underline-offset-2 hover:text-red"
                >
                  Промокоды: Сервисы и подписки
                </Link>
              </li>
              <li>
                <Link
                  href="/sovety/kak-ekonomit-na-produktah"
                  className="font-semibold text-ink underline underline-offset-2 hover:text-red"
                >
                  Как экономить на продуктах
                </Link>
              </li>
            </ul>
          </div>
          <div className="rounded-2xl border border-mint/30 bg-mint/10 p-6">
            <h2 className="font-display text-lg font-extrabold text-ink">
              Выгода каждый день в наших каналах
            </h2>
            <p className="mt-2 text-sm text-ink/60">
              Свежие промокоды, кешбэк и лайфхаки экономии.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={CHANNELS.telegram}
                target="_blank"
                rel="noopener nofollow"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-all hover:translate-y-[2px]"
              >
                Telegram
              </a>
              <a
                href={CHANNELS.vk}
                target="_blank"
                rel="noopener nofollow"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-all hover:translate-y-[2px]"
              >
                VK
              </a>
              <a
                href={CHANNELS.dzen}
                target="_blank"
                rel="noopener nofollow"
                className="rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-white transition-all hover:translate-y-[2px]"
              >
                Дзен
              </a>
            </div>
          </div>
        </section>

        {/* ADVERTISING MARKING (ОРД) */}
        <section className="mt-8 rounded-2xl border border-line bg-white p-4 text-xs leading-relaxed text-ink/45">
          <p>
            0+ Реклама. Рекламодатель: ПАО Сбербанк. ИНН 7707083893. Генеральная
            лицензия Банка России на осуществление банковских операций №1481 от
            11.08.2015 г. Кредитные карты предусматривают начисление процентов на
            сумму задолженности при её несвоевременном погашении. Условия
            кредитования и лимит устанавливаются банком индивидуально.
          </p>
          <p className="mt-2 font-bold text-ink/60">
            Оценивайте свои финансовые возможности и риски перед оформлением
            кредитной карты.
          </p>
          <p className="mt-2">
            Льготный период — до 120 дней 0%. Далее процентная ставка составляет
            49,8–59,8% годовых. Полная стоимость кредита (ПСК): 48,816%–58,320%
            годовых. Подробные условия — на официальном сайте банка:{" "}
            <a
              href="https://www.sberbank.ru/ru/person/cards/credit/sbercard?tab=5"
              target="_blank"
              rel="nofollow noopener"
              className="font-semibold text-ink underline underline-offset-2 hover:text-red"
            >
              sberbank.ru/credit_sberkarta
            </a>
            .
          </p>
          <p className="mt-2">
            Информация носит справочный характер. Нажимая на кнопку «Оформить»,
            вы переходите на сайт партнёра. ПромоФакт получает вознаграждение от
            банка, если вы оформите карту — для вас условия не меняются.
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer font-semibold text-ink/60">
              erid: 2RanynFCKB1
            </summary>
            <p className="mt-2">
              Идентификатор рекламного объявления (erid): 2RanynFCKB1.
            </p>
          </details>
        </section>
      </div>

      {/* STICKY CTA — всегда видна при скролле */}
      <SberStickyCta affiliateUrl={AFFILIATE_URL} />
    </main>
  );
}
