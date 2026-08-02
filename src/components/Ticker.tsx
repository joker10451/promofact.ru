import { getBestCoupons } from "@/lib/perfluence";

export default async function Ticker() {
  const coupons = await getBestCoupons();
  if (coupons.length === 0) return null;
  const items = coupons
    .slice(0, 12)
    .map(
      (c) => `${c.promocode.bonusName || c.promocode.code} · ${c.store.name}`,
    )
    .join(" · ");

  return (
    <div className="marquee-pause overflow-hidden bg-ink text-white py-2.5 border-b-4 border-yellow">
      <div className="flex w-max animate-ticker gap-0 whitespace-nowrap">
        <span className="text-xs sm:text-sm font-semibold tracking-wide pr-8">
          {items} ·
        </span>
        <span
          className="text-xs sm:text-sm font-semibold tracking-wide pr-8"
          aria-hidden="true"
        >
          {items} ·
        </span>
      </div>
    </div>
  );
}
