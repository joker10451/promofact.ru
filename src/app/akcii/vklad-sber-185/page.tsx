import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "Вклад в Сбере — розыгрыш 18,5 млн бонусов Спасибо | ПромоФакт",
  description:
    "Откройте любой вклад в Сбере со ставкой до 13,5% годовых и участвуйте в розыгрыше 18,5 млн бонусов Спасибо среди 1000 победителей. Условия участия и ссылка.",
  alternates: { canonical: `${SITE_URL}/akcii/vklad-sber-185` },
  openGraph: {
    title: "Вклад в Сбере — розыгрыш 18,5 млн бонусов Спасибо",
    description: "Ставка до 13,5% годовых и розыгрыш 18,5 млн бонусов Спасибо.",
    url: `${SITE_URL}/akcii/vklad-sber-185`,
    type: "website",
  },
};

const SBER_AFFILIATE_URL = "https://sberbank1.prfl.me/sites/iqsdgq?erid=2RanykueVCo";
const SBER_ERID = "2RanykueVCo";

export default function SberVkladPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-paper/40 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <nav aria-label="Хлебные крошки" className="mb-6 text-xs font-semibold text-ink/60">
            <Link href="/" className="hover:text-ink">
              Главная
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <Link href="/catalog" className="hover:text-ink">
              Каталог
            </Link>
            <span aria-hidden="true" className="mx-2">
              /
            </span>
            <span>Вклад в Сбере</span>
          </nav>

          <article className="overflow-hidden rounded-3xl border border-line bg-white shadow-sm">
            <div className="bg-gradient-to-br from-[#08a652] to-[#046833] p-8 text-white sm:p-12">
              <span className="inline-block rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-sm">
                Спецпроект · СберБанк
              </span>
              <h1 className="mt-4 font-display text-2xl font-black leading-tight sm:text-4xl">
                Розыгрыш 18,5 млн бонусов Спасибо за вклад в Сбере
              </h1>
              <p className="mt-4 max-w-2xl text-base text-white/90 sm:text-lg">
                Откройте любой вклад в Сбере и станьте участником масштабного розыгрыша 18,5 млн бонусов Спасибо.
                Всего 1000 победителей — высокие шансы на выигрыш!
              </p>
              <div className="mt-8">
                <a
                  href={SBER_AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex items-center justify-center rounded-2xl bg-white px-8 py-4 font-display text-base font-bold text-[#046833] shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Открыть вклад в Сбере →
                </a>
              </div>
            </div>

            <div className="p-8 sm:p-12">
              <h2 className="font-display text-xl font-bold text-ink sm:text-2xl">
                Условия участия в акции
              </h2>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl border border-line bg-paper/60 p-5">
                  <div className="text-sm font-semibold text-ink/60">Ставка по вкладу</div>
                  <div className="mt-1 font-display text-2xl font-black text-[#08a652]">до 13,5%</div>
                  <div className="mt-1 text-xs text-ink/70">на популярный срок 3–7 месяцев</div>
                </div>
                <div className="rounded-2xl border border-line bg-paper/60 p-5">
                  <div className="text-sm font-semibold text-ink/60">Призовой фонд</div>
                  <div className="mt-1 font-display text-2xl font-black text-[#08a652]">18,5 млн</div>
                  <div className="mt-1 text-xs text-ink/70">бонусов Спасибо</div>
                </div>
                <div className="rounded-2xl border border-line bg-paper/60 p-5">
                  <div className="text-sm font-semibold text-ink/60">Победители</div>
                  <div className="mt-1 font-display text-2xl font-black text-[#08a652]">1 000</div>
                  <div className="mt-1 text-xs text-ink/70">счастливчиков получат призы</div>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-sm leading-relaxed text-ink/80">
                <p>
                  Выгодная ставка до 13,5% годовых на популярный срок 3 — 7 месяцев и гибкие условия — открывайте
                  вклад и участвуйте в розыгрыше! 💵
                </p>
                <p>
                  Для участия достаточно перейти по специальной ссылке партнёра и оформить любой вклад онлайн в
                  приложении СберБанк Онлайн или на сайте.
                </p>
              </div>

              <div className="mt-8 border-t border-line pt-6">
                <a
                  href={SBER_AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-[#08a652] py-4 text-center font-display text-base font-bold text-white shadow-sm transition hover:bg-[#068f45]"
                >
                  Перейти на сайт Сбера и открыть вклад
                </a>
              </div>

              <div className="mt-6 rounded-xl bg-gray-50 p-4 text-xs text-gray-500">
                <p>
                  Реклама. Рекламодатель: ПАО Сбербанк. ИНН: 7707083893. Ген. лицензия Банка России на осуществление
                  банковских операций № 1481 от 11.08.2015 г. erid: {SBER_ERID}
                </p>
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </>
  );
}
