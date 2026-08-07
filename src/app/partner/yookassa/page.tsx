import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 600;

const PARTNER_URL = "https://yookassa.prfl.me/sites/5iqj3x?erid=2RanymXWEfm";
const ERID = "2RanymXWEfm";

export const metadata: Metadata = {
  title: "ЮKassa для бизнеса: приём платежей без комиссии 90 дней",
  description:
    "Подключите ЮKassa и принимайте платежи картами и кошельком ЮMoney без комиссии 90 дней или до 1 000 000 ₽ оборота. Для ИП, ООО и самозанятых.",
  alternates: { canonical: `${SITE_URL}/partner/yookassa` },
  robots: { index: true, follow: true },
};

const faq = [
  {
    q: "Что такое ЮKassa?",
    a: "Сервис для приёма платежей, который выбрали 40% российских интернет-магазинов. Автоматизирует бизнес-процессы и даёт покупателям понятную оплату.",
  },
  {
    q: "Сколько стоит подключение?",
    a: "Пакет платежей стоит 1 ₽. Он включает платежи картами и кошельком ЮMoney без комиссии до оборота 1 000 000 ₽ или 90 дней (что наступит раньше).",
  },
  {
    q: "Кому подходит ЮKassa?",
    a: "Самозанятым, ИП и юридическим лицам. Работает через сайт, приложение или без них — по ссылке и QR-коду.",
  },
  {
    q: "Нужна ли маркировка рекламы?",
    a: "Да. Это партнёрская публикация (CPA-оффер). Рекламодатель ООО НКО «ЮМани», лицензия Банка России № 3510-К. Маркер рекламы: erid=2RanymXWEfm.",
  },
];

export default function YookassaPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Партнёры",
        item: `${SITE_URL}/partner/yookassa`,
      },
    ],
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <JsonLd data={breadcrumb} />
      <JsonLd data={faqJsonLd} />

      <nav aria-label="Хлебные крошки" className="mb-6 text-sm text-ink/60">
        <Link href="/" className="hover:text-ink">
          Главная
        </Link>
        <span className="mx-2">/</span>
        <span aria-current="page" className="text-ink">
          Партнёры
        </span>
      </nav>

      <div className="rounded-xl border border-yellow/50 bg-yellow/10 px-4 py-3 text-xs font-medium text-ink/70">
        Реклама. ООО НКО «ЮМани». Лицензия Банка России № 3510-К. Маркер
        рекламы: erid={ERID}.
      </div>

      <h1 className="mt-6 font-display text-2xl font-extrabold sm:text-3xl">
        ЮKassa для бизнеса: принимайте платежи без комиссии 90 дней
      </h1>
      <p className="mt-3 text-ink/60">
        Современному бизнесу нужна удобная платёжная система. ЮKassa —
        один из самых популярных сервисов в России: через него работают 40%
        интернет-магазинов. Подключение от 1 дня, всё онлайн, без визита в
        офис.
      </p>

      <div className="mt-6 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-extrabold">Что внутри</h2>
        <ul className="mt-4 space-y-3 text-sm text-ink/70">
          <li>· Без комиссии 90 дней или до 1 000 000 ₽ оборота</li>
          <li>· Все популярные способы: карты, SberPay, «Покупки в кредит»</li>
          <li>· Автоотправка чеков по 54-ФЗ (Чеки от ЮKassa)</li>
          <li>· Подходит ИП, ООО и самозанятым</li>
          <li>· Готовые модули для конструкторов + понятная API-документация</li>
          <li>· Приём платежей по ссылке или QR без сайта</li>
        </ul>
      </div>

      <div className="mt-6 rounded-2xl border border-mint/30 bg-mint/10 p-6 text-center">
        <div className="font-display text-3xl font-extrabold">
          1 000 000 ₽
        </div>
        <div className="mt-1 text-sm text-ink/60">
          оборот без комиссии — пока не достигнет или 90 дней
        </div>
        <a
          href={PARTNER_URL}
          target="_blank"
          rel="nofollow noopener sponsored"
          className="mt-4 inline-block rounded-full bg-red px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
        >
          Подключить за 1 ₽
        </a>
        <p className="mt-2 text-xs text-ink/40">
          Партнёрская ссылка. Реклама. erid={ERID}
        </p>
      </div>

      <section className="mt-8" aria-label="Частые вопросы">
        <h2 className="font-display text-xl font-extrabold">Вопросы и ответы</h2>
        <div className="mt-4 space-y-3">
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

      <p className="mt-8 text-xs text-ink/40">
        Материал подготовлен по данным рекламодателя ООО НКО «ЮМани»
        (лицензия Банка России № 3510-К). Стоимость подключения пакета
        платежей — 1 ₽. Подробнее на сайте рекламодателя.
      </p>
    </main>
  );
}
