import Link from "next/link";
import CampaignExpiryGate from "@/components/CampaignExpiryGate";
import { getActivePromoBanners } from "@/lib/promoBanners";

/** Compact advertising teaser; the complete creative is on its landing. */
export default function SberUlybatlHome() {
  const campaign = getActivePromoBanners().find((b) => b.id === "sber-ulybatl-185-2026");
  if (!campaign) return null;

  return (
    <CampaignExpiryGate endsAt={campaign.endsAt}>
      <article className="min-w-0 rounded-2xl border border-line bg-white p-4 transition-colors hover:border-mint/60 sm:p-5">
        <Link
          href="/akcii/ulybatl-sber-185"
          className="group block rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-mint"
          aria-label="Сбер Улыбатл: открыть условия рекламного розыгрыша"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-ink/60">Сбер · до 25 октября · 18+</p>
              <h3 className="mt-1 font-display text-sm font-extrabold leading-snug text-ink sm:text-base">
                Улыбатл: призы за оплату улыбкой
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-ink/75 sm:text-sm">
                Розыгрыш автомобиля, смартфонов и промокодов. Подробности — на странице акции.
              </p>
            </div>
            <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-ink/60 transition-colors group-hover:border-mint group-hover:text-ink">↗</span>
          </div>
          <span className="mt-3 inline-flex text-xs font-bold text-ink underline decoration-mint/50 underline-offset-4 group-hover:decoration-mint">
            Смотреть условия →
          </span>
        </Link>
        <p className="mt-3 border-t border-line/60 pt-2 text-[10px] leading-relaxed text-ink/55">
          {campaign.ordText}
        </p>
      </article>
    </CampaignExpiryGate>
  );
}
