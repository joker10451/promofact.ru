import Image from "next/image";
import Link from "next/link";
import CampaignExpiryGate from "@/components/CampaignExpiryGate";
import { getActivePromoBanners } from "@/lib/promoBanners";

/**
 * The campaign is a sponsored editorial placement, not a coupon or a discount.
 * Display the untouched advertiser creative without overlays/cropping.
 */
export default function SberKidsPromoHome() {
  const campaign = getActivePromoBanners().find((item) => item.id === "sber-kids-card-10000-500-2026");
  if (!campaign?.image) return null;

  return (
    <CampaignExpiryGate endsAt={campaign.endsAt}>
      <section aria-label="Реклама: Детская СберКарта" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-[#a9d7ba] bg-[#edfff2] shadow-2xs">
          <div className="grid items-center lg:grid-cols-[minmax(0,1.12fr)_minmax(0,0.88fr)]">
            <Link
              href="/akcii/detskaya-sberkarta-10000-500"
              className="block overflow-hidden bg-[#053924] focus-visible:outline-4 focus-visible:outline-[#267e53]"
              aria-label="Условия акции Детская СберКарта"
            >
              <Image
                src={campaign.image}
                alt={campaign.imageAlt ?? campaign.title}
                width={2048}
                height={1461}
                sizes="(min-width: 1280px) 690px, (min-width: 1024px) 55vw, 100vw"
                className="h-auto w-full object-contain"
              />
            </Link>
            <div className="flex flex-col items-start gap-4 p-5 sm:p-7 lg:p-9">
              <span className="rounded-full border border-[#b5deb4] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#155f3a]">
                Реклама · до 31 октября
              </span>
              <h2 className="font-display text-xl font-extrabold leading-tight text-[#113f2d] sm:text-2xl">
                Детская СберКарта: сертификат 500 ₽ и шанс выиграть 10 000 бонусов
              </h2>
              <p className="text-sm leading-relaxed text-[#315b44]">
                Оформите детскую СберКарту. При пополнении от 2 000 ₽ можно участвовать в розыгрыше
                бонусов СберСпасибо. Сертификат на 500 ₽ предоставляется при выполнении условий
                партнёрской акции. Выигрыш 10 000 бонусов не гарантирован.
              </p>
              <Link
                href="/akcii/detskaya-sberkarta-10000-500"
                className="inline-flex items-center gap-2 rounded-xl bg-[#08783f] px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-[#05552d]"
              >
                Условия и оформление <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-ink/60">{campaign.ordText}</p>
      </section>
    </CampaignExpiryGate>
  );
}
