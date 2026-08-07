import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/lib/site";

export const revalidate = 600;

const PARTNER_URL = "https://ntprnt.prfl.me/sites/ntif0y?erid=2RanymGhNJ7";
const ERID = "2RanymGhNJ7";

export const metadata: Metadata = {
  title: "Net Print: интерьерная печать со скидкой 30% на первый заказ",
  description:
    "Net Print (net Print) — интерьерная печать: фотокниги, снимки, памятные подарки. Промокод ALL30_6P3BRXJY — скидка 30% на первый заказ, ALL15_5P69NB7V — 15% на повторный.",
  alternates: { canonical: `${SITE_URL}/partner/netprint` },
  robots: { index: true, follow: true },
};

const faq = [
  {
    q: "Что такое Net Print?",
    a: "Сервис интерьерной печати: фотокниги, печать снимков, постеры и памятные подарки. Оформляете семейные фото в красивые форматы.",
  },
  {
    q: "Какие промокоды действуют?",
    a: "ALL30_6P3BRXJY — скидка 30% на первый заказ. ALL15_5P69NB7V — скидка 15% на каждый повторный заказ. Коды не суммируются с акциями и другими скидками.",
  },
  {
    q: "Нужна ли маркировка рекламы?",
    a: "Да. Это партнёрская публикация (CPA-оффер). Рекламодатель ООО «Фотоэксперт», ИНН 7724709637, ОГРН 1097746355266. Маркер рекламы: erid=2RanymGhNJ7.",
  },
];

export default function NetprintPage() {
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
        item: `${SITE_URL}/partner/netprint`,
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
        Реклама. ООО «Фотоэксперт», ИНН 7724709637, ОГРН 1097746355266.
        Маркер рекламы: erid={ERID}.
      </div>

      <h1 className="mt-6 font-display text-2xl font-extrabold sm:text-3xl">
        Net Print: интерьерная печать со скидкой 30% на первый заказ
      </h1>
      <p className="mt-3 text-ink/60">
        Первый звонок, первый портфель, первое фото у класса. Эти моменты
        хочется сохранить не только в телефоне. Net Print печатает
        фотокниги, снимки и памятные подарки, чтобы воспоминания жили в
        интерьере.
      </p>

      <img
        src="/partner/netprint-banner.png"
        alt="Net Print — интерьерная печать: скидка 30% на первый заказ"
        width={1200}
        height={630}
        className="mt-6 w-full rounded-2xl border border-line"
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="font-display text-3xl font-extrabold text-red">
            −30%
          </div>
          <div className="mt-1 text-sm text-ink/60">на первый заказ</div>
          <code className="mt-3 block rounded-lg bg-paper px-3 py-2 text-center font-mono text-sm font-bold">
            ALL30_6P3BRXJY
          </code>
        </div>
        <div className="rounded-2xl border border-line bg-white p-5">
          <div className="font-display text-3xl font-extrabold text-red">
            −15%
          </div>
          <div className="mt-1 text-sm text-ink/60">на каждый повторный заказ</div>
          <code className="mt-3 block rounded-lg bg-paper px-3 py-2 text-center font-mono text-sm font-bold">
            ALL15_5P69NB7V
          </code>
        </div>
      </div>
      <p className="mt-2 text-xs text-ink/40">
        *Промокоды не суммируются с акциями и другими скидками.
      </p>

      <div className="mt-6 rounded-2xl border border-mint/30 bg-mint/10 p-6 text-center">
        <a
          href={PARTNER_URL}
          target="_blank"
          rel="nofollow noopener sponsored"
          className="inline-block rounded-full bg-red px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-[1.02]"
        >
          Перейти к заказу Net Print
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
    </main>
  );
}
