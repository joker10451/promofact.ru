import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { SITE_NAME, SITE_URL, CHANNELS } from "@/lib/site";

const AFFILIATE_URL =
  "https://sberbank1.prfl.me/sites/lccq8a?erid=2RanynFCKB1";

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
    icon: "🗓",
    title: "До 120 дней без процентов",
    text: "Грейс-период на покупки: оплачивайте в рамках льготного периода и не платите проценты за пользование.",
  },
  {
    icon: "💳",
    title: "Лимит до 1 млн ₽",
    text: "Достаточно на крупные покупки и повседневные расходы. Решение по лимиту принимает банк индивидуально.",
  },
  {
    icon: "🎁",
    title: "До 30% кешбэк у партнёров",
    text: "Возврат на карту за покупки у партнёров Сбера и в популярных категориях — от кафе до маркетплейсов.",
  },
  {
    icon: "💰",
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
      url: AFFILIATE_URL,
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

  return (
    <main className="min-h-screen bg-paper pb-20">
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
        <section className="mt-6 overflow-hidden rounded-3xl border border-line bg-gradient-to-br from-white to-mint/20 p-6 shadow-[0_4px_0_rgba(11,16,43,0.06)] sm:p-10">
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
            Удобный способ оплачивать покупки сейчас и возвращать деньги позже.
            До 120 дней без процентов, лимит до 1 млн ₽ и кешбэк до 30% у
            партнёров.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              href={AFFILIATE_URL}
              target="_blank"
              rel="nofollow noopener sponsored"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-red px-6 py-4 text-base font-extrabold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
            >
              Оформить СберКарту →
            </a>
            <span className="text-sm font-semibold text-ink/50">
              Доставка карты уже сегодня
            </span>
          </div>
        </section>

        {/* BENEFITS */}
        <section className="mt-10">
          <h2 className="font-display text-2xl font-extrabold text-ink">
            Что внутри карты
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="rounded-2xl border border-line bg-white p-5 transition-all hover:border-mint"
              >
                <div className="text-3xl" aria-hidden="true">
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

        {/* CONDITIONS TABLE */}
        <section className="mt-10 overflow-hidden rounded-2xl border border-line bg-white shadow-[0_4px_0_rgba(11,16,43,0.06)]">
          <div className="bg-ink px-5 py-3 text-xs font-bold uppercase tracking-wider text-yellow">
            📊 Условия Кредитной СберКарты
          </div>
          <div className="divide-y divide-line">
            {[
              ["Льготный период", "до 120 дней без процентов"],
              ["Кредитный лимит", "до 1 000 000 ₽"],
              ["Кешбэк у партнёров", "до 30%"],
              ["Обслуживание", "0 ₽ в месяц"],
              ["Оформление", "онлайн, доставка сегодня"],
            ].map(([k, v]) => (
              <div
                key={k}
                className="flex items-center justify-between px-5 py-3.5 text-sm"
              >
                <span className="font-medium text-ink/60">{k}</span>
                <span className="font-extrabold text-ink">{v}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA SECONDARY */}
        <section className="mt-8 rounded-3xl border border-mint/40 bg-mint/10 p-6 text-center sm:p-8">
          <h2 className="font-display text-xl font-extrabold text-ink sm:text-2xl">
            Заберите карту с доставкой уже сегодня
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink/65">
            Оформление онлайн занимает несколько минут. Курьер привезёт карту —
            в ряде регионов в день заявки.
          </p>
          <a
            href={AFFILIATE_URL}
            target="_blank"
            rel="nofollow noopener sponsored"
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-2xl bg-ink px-8 py-4 text-base font-extrabold text-white shadow-offset-red transition-all hover:translate-y-[2px] hover:shadow-none"
          >
            Оформить Кредитную СберКарту
          </a>
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
                  <span className="float-right text-red group-open:hidden">
                    +
                  </span>
                  <span className="float-right text-red hidden group-open:inline">
                    −
                  </span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-ink/70">
                  {f.a}
                </p>
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
    </main>
  );
}
