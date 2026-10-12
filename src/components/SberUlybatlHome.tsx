import Image from "next/image";
import Link from "next/link";
import { getActivePromoBanners } from "@/lib/promoBanners";
import CampaignExpiryGate from "@/components/CampaignExpiryGate";

/** Scoped home teaser; no entry added to coupons or search discount counters. */
export default function SberUlybatlHome() {
  const campaign = getActivePromoBanners().find((b) => b.id === "sber-ulybatl-185-2026");
  if (!campaign?.image) return null;

  return (
    <CampaignExpiryGate endsAt={campaign.endsAt}>
      <section aria-label="Рекламный спецпроект Сбер Улыбатл" className="mx-auto max-w-7xl px-4 pt-8 sm:px-6">
        <div className="overflow-hidden rounded-3xl border border-[#b0ddb0] bg-[#f0fff1] shadow-2xs">
          <div className="grid md:grid-cols-[minmax(0,1.18fr)_minmax(0,0.82fr)]">
            <Link href="/akcii/sber-ulybatl-185" className="block overflow-hidden bg-[#032913] focus-visible:outline-4 focus-visible:outline-green-500" aria-label="Подробнее о розыгрыше Сбер Улыбатл">
              <Image src={campaign.image} alt={campaign.imageAlt || campaign.title} width={1600} height={1141} sizes="(min-width: 1280px) 690px, (min-width: 768px) 55vw, 100vw" className="h-auto w-full" priority={false} />
            </Link>
            <div className="flex flex-col justify-center gap-4 p-5 sm:p-7 lg:p-9">
              <span className="w-fit rounded-full border border-[#b5deb4] bg-white px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider text-[#15643b]">Реклама · Спецпроект до 25 октября</span>
              <h2 className="font-display text-xl font-extrabold leading-snug text-[#103826] sm:text-2xl">
                Улыбатл Сбера: призы за оплату улыбкой
              </h2>
              <p className="text-sm leading-relaxed text-[#315b44]">
                Города соревнуются за концерт Вани Дмитриенко. У участников — шанс выиграть Chery Tiggo 9, iPhone 17 Pro Max и промокоды. Условия и порядок участия — на странице акции.
              </p>
              <Link href="/akcii/sber-ulybatl-185" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#08783f] px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-[#05552d]">
                Подробнее об Улыбатле <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
        <p className="mt-2 text-[10px] leading-relaxed text-ink/55">{campaign.ordText}</p>
      </section>
    </CampaignExpiryGate>
  );
}
