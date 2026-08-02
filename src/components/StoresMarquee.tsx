import { getStores } from "@/lib/perfluence";

export default async function StoresMarquee() {
  const stores = await getStores();
  if (stores.length === 0) return null;
  const names = stores.map((s) => s.name).join("  •  ");

  return (
    <div className="marquee-pause overflow-hidden bg-yellow py-3 border-y-4 border-ink">
      <div className="flex w-max animate-marquee-fast whitespace-nowrap">
        <span className="font-display text-sm sm:text-base font-bold tracking-wide pr-10">
          {names}  •
        </span>
        <span
          className="font-display text-sm sm:text-base font-bold tracking-wide pr-10"
          aria-hidden="true"
        >
          {names}  •
        </span>
      </div>
    </div>
  );
}