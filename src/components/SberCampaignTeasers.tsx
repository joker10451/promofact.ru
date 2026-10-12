import SberKidsPromoHome from "@/components/SberKidsPromoHome";
import SberUlybatlHome from "@/components/SberUlybatlHome";
import CampaignExpiryGate from "@/components/CampaignExpiryGate";
import { getActivePromoBanners } from "@/lib/promoBanners";

/**
 * One compact sponsored area AFTER the real coupon catalog on the homepage.
 * Do not render an empty heading when the campaigns have already expired at
 * build time. The client expiry gate hides cached output after Oct 31 (MSK).
 */
export default function SberCampaignTeasers() {
  const active = getActivePromoBanners();
  const hasSberCampaign = active.some(
    (campaign) =>
      campaign.id === "sber-ulybatl-185-2026" ||
      campaign.id === "sber-kids-card-10000-500-2026",
  );
  if (!hasSberCampaign) return null;

  return (
    <CampaignExpiryGate endsAt="2026-10-31">
      <section
        aria-labelledby="sber-specials-heading"
        className="mx-auto max-w-7xl px-4 pb-3 pt-3 sm:px-6"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 id="sber-specials-heading" className="font-display text-base font-extrabold text-ink sm:text-lg">
            Специальные предложения
          </h2>
          <span className="text-[11px] font-medium text-ink/50">Реклама</span>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <SberUlybatlHome />
          <SberKidsPromoHome />
        </div>
      </section>
    </CampaignExpiryGate>
  );
}
