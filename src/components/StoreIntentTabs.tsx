import Icon from "@/components/Icon";
import Link from "next/link";

interface StoreIntentTabsProps {
  storeSlug: string;
  activeTab: "all" | "first-order" | "repeat-order";
  allCount: number;
  firstCount: number;
  repeatCount: number;
}

export default function StoreIntentTabs({
  storeSlug,
  activeTab,
  allCount,
  firstCount,
  repeatCount,
}: StoreIntentTabsProps) {
  return (
    <nav
      aria-label="Фильтр купонов по типу заказа"
      className="flex flex-wrap items-center gap-2 mb-5"
    >
      {/* 1. Все предложения */}
      <Link
        href={`/store/${storeSlug}`}
        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
          activeTab === "all"
            ? "bg-ink text-white font-extrabold shadow-xs"
            : "border border-line bg-white text-ink/70 hover:border-ink hover:text-ink"
        }`}
      >
        <Icon name="flame" size={14} />
        <span>Все акции</span>
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
            activeTab === "all" ? "bg-white/20 text-white" : "bg-paper text-ink/60"
          }`}
        >
          {allCount}
        </span>
      </Link>

      {/* 2. На первый заказ */}
      <Link
        href={`/store/${storeSlug}/first-order`}
        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
          activeTab === "first-order"
            ? "bg-red text-white font-extrabold shadow-xs"
            : "border border-line bg-white text-ink/70 hover:border-red hover:text-red"
        }`}
      >
        <Icon name="gift" size={14} />
        <span>На первый заказ</span>
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
            activeTab === "first-order" ? "bg-white/20 text-white" : "bg-paper text-ink/60"
          }`}
        >
          {firstCount}
        </span>
      </Link>

      {/* 3. Повторные заказы */}
      <Link
        href={`/store/${storeSlug}/repeat-order`}
        className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shadow-2xs ${
          activeTab === "repeat-order"
            ? "bg-mint-dark text-white font-extrabold shadow-xs"
            : "border border-line bg-white text-ink/70 hover:border-mint-dark hover:text-mint-dark"
        }`}
      >
        <Icon name="repeat" size={14} />
        <span>Повторные заказы</span>
        <span
          className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
            activeTab === "repeat-order" ? "bg-white/20 text-white" : "bg-paper text-ink/60"
          }`}
        >
          {repeatCount}
        </span>
      </Link>
    </nav>
  );
}
