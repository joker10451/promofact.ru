"use client";

import Icon from "@/components/Icon";

export default function HeaderSearchTrigger() {
  const handleClick = () => {
    window.dispatchEvent(new CustomEvent("promo:open-search"));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label="Поиск по магазинам и купонам"
      className="flex items-center gap-2 rounded-full border border-line bg-paper/60 px-3 py-1.5 text-xs font-medium text-ink/60 hover:border-ink/30 hover:bg-white hover:text-ink transition-all cursor-pointer shadow-2xs h-9 min-w-[36px] justify-center"
    >
      <Icon name="search" size={15} className="text-ink/50" />
      <span className="hidden md:inline text-xs">Поиск...</span>
      <kbd className="hidden lg:inline-block rounded bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-ink/40 border border-line">
        ⌘K
      </kbd>
    </button>
  );
}
