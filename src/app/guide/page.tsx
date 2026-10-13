import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HowItWorks from "@/components/HowItWorks";
import Faq from "@/components/Faq";
import SeoArticle from "@/components/SeoArticle";
import Subscribe from "@/components/Subscribe";
import JsonLd from "@/components/JsonLd";
import { FAQ_ITEMS } from "@/lib/faqContent";
import { SITE_URL } from "@/lib/site";

export const revalidate = false;

export const metadata: Metadata = {
  title: "Как пользоваться промокодами — инструкция и ответы",
  description: "Пошаговая инструкция: как найти и применить промокод, проверить условия скидки и разобраться, почему купон не сработал. Ответы на частые вопросы.",
  alternates: { canonical: `${SITE_URL}/guide` },
  openGraph: {
    title: "Как применить промокод — ПромоФакт",
    description: "Инструкция по использованию промокодов и ответы на вопросы о скидках.",
    url: `${SITE_URL}/guide`,
    siteName: "ПромоФакт",
    type: "website",
    locale: "ru_RU",
  },
};

export default function GuidePage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: FAQ_ITEMS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        }}
      />
      <Header />
      <main className="min-h-screen">
        <div className="border-b border-line bg-white/80">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
            <nav aria-label="Хлебные крошки" className="text-xs font-semibold text-ink/55">
              <Link href="/" className="hover:text-red">Главная</Link>
              <span className="mx-2" aria-hidden="true">/</span>
              <span aria-current="page" className="text-ink">Как применять промокоды</span>
            </nav>
            <h1 className="mt-5 font-display text-2xl font-extrabold text-ink sm:text-4xl">Как пользоваться промокодами</h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-ink/65 sm:text-base">
              Найдите подходящую акцию, прочитайте условия и примените код в магазине. Здесь собраны инструкции и ответы на вопросы.
            </p>
            <Link href="/catalog#catalog" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-red px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-dark">
              Перейти к купонам <span className="ml-2" aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="py-9 sm:py-12"><HowItWorks /></div>
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
          <Faq />
        </div>
        <div className="py-6 sm:py-9"><SeoArticle /></div>
        <Subscribe />
      </main>
      <Footer />
    </>
  );
}
