import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import CampaignExpiryGate from "@/components/CampaignExpiryGate";
import { PROMO_BANNERS } from "@/lib/promoBanners";
import { SITE_URL } from "@/lib/site";

const campaign = PROMO_BANNERS.find((item) => item.id === "sber-kids-card-10000-500-2026" )!;
if (!campaign) throw new Error("Missing Sber Kids campaign");

const route = "/akcii/detskaya-sberkarta-10000-500";

export const metadata: Metadata = {
  title: "Детская СберКарта: сертификат 500 ₽ и розыгрыш 10 000 бонусов",
  description:
    "Детская СберКарта до 31 октября 2026 года: шанс выиграть 10 000 бонусов СберСпасибо и сертификат на 500 ₽ по условиям акции. Рекламодатель ПАО Сбербанк.",
  alternates: { canonical: `${SITE_URL}${route}` },
  robots: { index: false, follow: true },
  openGraph: {
    title: "Детская СберКарта: 500 ₽ и розыгрыш бонусов",
    description: "Оригинальный баннер и условия участия в акции до 31 октября 2026 года.",
    url: `${SITE_URL}${route}`,
    type: "website",
    images: [{ url: `${SITE_URL}/images/sber-kids-card-10000-500-2026.png`, width: 2048, height: 1461, alt: campaign.imageAlt }],
  },
};

export default function SberKidsPromoPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-paper/40 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav aria-label="Хлебные крошки" className="mb-6 text-xs font-semibold text-ink/60">
            <Link href="/" className="hover:text-ink">Главная</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span>Детская СберКарта</span>
          </nav>
          <div className="mb-6 text-center">
            <span className="rounded-full border border-[#8bd8a0] bg-[#e8f9ed] px-3 py-1 text-xs font-bold text-[#096431]">
              Реклама · ПАО Сбербанк
            </span>
            <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-ink sm:text-4xl">
              Детская СберКарта: сертификат и розыгрыш бонусов СберСпасибо
            </h1>
            <p className="mx-auto mt-3 max-w-3xl text-sm leading-relaxed text-ink/70 sm:text-base">
              Оформление по специальной ссылке до 31 октября 2026 года.
              10 000 бонусов — приз розыгрыша, а не гарантированное начисление каждому.
              Проверяйте условия сертификата, участия и накопительного счёта.
            </p>
          </div>
          <CampaignExpiryGate endsAt={campaign.endsAt}>
            <PromoBanner banner={campaign} />
          </CampaignExpiryGate>
          <div className="mx-auto mt-8 max-w-[1100px] rounded-2xl border border-line bg-white p-5 text-sm leading-relaxed text-ink/75 sm:p-7">
            <h2 className="font-display text-lg font-bold text-ink">Важно об условиях</h2>
            <p className="mt-2">
              Чтобы участвовать в розыгрыше, недостаточно просто открыть карту: следуйте официальным правилам,
              включая пополнение от 2 000 ₽ и необходимые подтверждения. Сертификат на 500 ₽ — отдельная
              партнёрская акция с собственными условиями. Размер кешбэка и ставки может зависеть от продукта и условий.
            </p>
            <p className="mt-3">
              <a
                href="https://www.sberbank.ru/common/img/uploaded/cards/sberkarta_kids/pravila_akcii_bonus_osen.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#08783f] underline underline-offset-4"
              >
                Прочитать правила розыгрыша (PDF)
              </a>
              <span className="mx-2" aria-hidden="true">·</span>
              <a href="mailto:sber.certificate@perfluence.io" className="underline underline-offset-4">
                Вопросы по сертификату
              </a>
            </p>
            <p className="mt-3 text-xs text-ink/60">
              Акция ограничена по сроку и условиям участия. Информация носит рекламный характер.
            </p>
            <Link href="/" className="mt-4 inline-block font-semibold text-ink underline underline-offset-4">
              Вернуться к предложениям ПромоФакта
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
