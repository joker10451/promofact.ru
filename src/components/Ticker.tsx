import { coupons } from "@/lib/data";

export default function Ticker() {
  const items = coupons.map((c) => `${c.discount} ${c.store}`).join(" · ");

  return (
    <div className="marquee-pause overflow-hidden bg-ink text-white py-2.5 border-b-4 border-yellow">
      <div className="flex w-max animate-ticker gap-0 whitespace-nowrap">
        <span className="text-xs sm:text-sm font-semibold tracking-wide pr-8">{items} ·</span>
        <span className="text-xs sm:text-sm font-semibold tracking-wide pr-8" aria-hidden="true">
          {items} ·
        </span>
      </div>
    </div>
  );
}
