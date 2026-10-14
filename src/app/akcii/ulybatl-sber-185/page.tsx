import type { Metadata } from "next";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import PromoBanner from "@/components/PromoBanner";
import CampaignExpiryGate from "@/components/CampaignExpiryGate";
import { PROMO_BANNERS, PAUSED_PROMO_BANNER_IDS } from "@/lib/promoBanners";
import { SITE_URL } from "@/lib/site";

const campaign = PROMO_BANNERS.find((b) => b.id === "sber-ulybatl-185-2026")!;
if (!campaign) throw new Error("Missing Ulybatl campaign configuration");

export const metadata: Metadata = {
  title: "Улыбатл Сбер 185 — розыгрыш призов за оплату улыбкой",
  description: "Улыбатл до 25 октября 2026: города соревнуются за концерт Вани Дмитриенко, а участники — за Chery Tiggo 9, iPhone 17 Pro Max и промокоды. Условия участия и регистрация.",
  alternates: { canonical: `${SITE_URL}/akcii/ulybatl-sber-185` },
  openGraph: {
    title: "Улыбатл Сбер — розыгрыш призов за оплату улыбкой",
    description: "Соревнование городов до 25 октября. Условия, призы и регистрация.",
    url: `${SITE_URL}/akcii/ulybatl-sber-185`,
    type: "website",
    images: [{ url: `${SITE_URL}/images/sber-ulybatl-185.webp`, width: 1600, height: 1141, alt: campaign.imageAlt }],
  },
};

export default function SberUlybatlPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-paper/40 py-8 sm:py-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <nav aria-label="Хлебные крошки" className="mb-6 text-xs font-semibold text-ink/60">
            <Link href="/" className="hover:text-ink">Главная</Link>
            <span aria-hidden="true" className="mx-2">/</span>
            <span>Спецпроект «Улыбатл»</span>
          </nav>
          <div className="mb-6 text-center">
            <span className="rounded-full border border-[#8bd8a0] bg-[#e8f9ed] px-3 py-1 text-xs font-bold text-[#096431]">Реклама · Спецпроект Сбера</span>
            <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-ink sm:text-4xl">
              Улыбатл: соревнование городов и розыгрыш призов
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-ink/65 sm:text-base">
              Призы за оплату улыбкой. Период проведения — до 25 октября 2026 года. Проверяйте подробные правила у организатора.
            </p>
          </div>

          {PAUSED_PROMO_BANNER_IDS.has(campaign.id) ? (
            <div role="status" className="mx-auto max-w-[950px] rounded-2xl border border-amber-300 bg-amber-50 px-5 py-6 text-center text-sm font-semibold text-amber-950">
              Акция временно приостановлена по уведомлению партнёрской сети от 13 октября 2026 года. Регистрация по рекламной ссылке сейчас недоступна на ПромоФакте.
            </div>
          ) : (
            <CampaignExpiryGate endsAt={campaign.endsAt}>
              <PromoBanner banner={campaign} />
            </CampaignExpiryGate>
          )}

          <div className="mx-auto mt-8 max-w-[950px] rounded-2xl border border-line bg-white px-5 py-4 text-sm leading-relaxed text-ink/65">
            <p>Участие и вручение призов регулируются официальными правилами акции. Наличие оплаты улыбкой само по себе не гарантирует выигрыш. Подробные требования и сроки уточняйте на странице организатора.</p>
            <p className="mt-3">
              <Link href="/" className="font-bold text-ink underline underline-offset-4">Вернуться к акциям ПромоФакта</Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
