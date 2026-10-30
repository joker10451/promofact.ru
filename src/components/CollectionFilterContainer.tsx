"use client";

import { useState, useMemo, type ReactNode } from "react";
import StoreLogo from "@/components/StoreLogo";

export interface CollectionFilterItem {
  id: string;
  storeSlug: string;
  storeName: string;
  storeLogo: string | null;
  isFirstOrder: boolean;
  isTop: boolean;
  element: ReactNode;
}

interface CollectionFilterContainerProps {
  items: CollectionFilterItem[];
}

export default function CollectionFilterContainer({ items }: CollectionFilterContainerProps) {
  const [activeTab, setActiveTab] = useState<"all" | "top" | "first" | "repeat">("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");

  const counts = useMemo(() => {
    return {
      all: items.length,
      top: items.filter((i) => i.isTop).length,
      first: items.filter((i) => i.isFirstOrder).length,
      repeat: items.filter((i) => !i.isFirstOrder).length,
    };
  }, [items]);

  const uniqueStores = useMemo(() => {
    const map = new Map<string, { slug: string; name: string; logo: string | null; count: number }>();
    for (const item of items) {
      const existing = map.get(item.storeSlug);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(item.storeSlug, {
          slug: item.storeSlug,
          name: item.storeName,
          logo: item.storeLogo,
          count: 1,
        });
      }
    }
    return Array.from(map.values());
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // 1. Фильтр по магазину
      if (selectedStore !== "all" && item.storeSlug !== selectedStore) {
        return false;
      }
      // 2. Фильтр по типу оффера
      if (activeTab === "top" && !item.isTop) return false;
      if (activeTab === "first" && !item.isFirstOrder) return false;
      if (activeTab === "repeat" && item.isFirstOrder) return false;
      return true;
    });
  }, [items, activeTab, selectedStore]);

  const tabBtnCls = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
      active
        ? "bg-red text-white shadow-2xs"
        : "bg-paper border border-line text-ink/75 hover:border-red hover:text-red"
    }`;

  const storePillCls = (active: boolean) =>
    `rounded-xl px-2.5 py-1 text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
      active
        ? "bg-ink text-white shadow-2xs"
        : "bg-white border border-line text-ink/75 hover:border-ink/40"
    }`;

  return (
    <div className="mt-8 space-y-5">
      {/* Панель фильтров: табы условий */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab("all")}
          className={tabBtnCls(activeTab === "all")}
        >
          <span>Все предложения</span>
          <span className="opacity-70 text-[11px]">({counts.all})</span>
        </button>
        {counts.top > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("top")}
            className={tabBtnCls(activeTab === "top")}
          >
            <span>🔥 Топ-выгода</span>
            <span className="opacity-70 text-[11px]">({counts.top})</span>
          </button>
        )}
        {counts.first > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("first")}
            className={tabBtnCls(activeTab === "first")}
          >
            <span>👤 Первый заказ</span>
            <span className="opacity-70 text-[11px]">({counts.first})</span>
          </button>
        )}
        {counts.repeat > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab("repeat")}
            className={tabBtnCls(activeTab === "repeat")}
          >
            <span>🔁 Повторные заказы</span>
            <span className="opacity-70 text-[11px]">({counts.repeat})</span>
          </button>
        )}
      </div>

      {/* Быстрый фильтр по магазинам (если в подборке больше одного магазина) */}
      {uniqueStores.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          <button
            type="button"
            onClick={() => setSelectedStore("all")}
            className={storePillCls(selectedStore === "all")}
          >
            <span>Все магазины</span>
            <span className="opacity-60 text-[11px]">({items.length})</span>
          </button>
          {uniqueStores.map((store) => (
            <button
              key={store.slug}
              type="button"
              onClick={() => setSelectedStore(selectedStore === store.slug ? "all" : store.slug)}
              className={storePillCls(selectedStore === store.slug)}
            >
              <StoreLogo
                slug={store.slug}
                name={store.name}
                logo={store.logo}
                size={18}
                className="h-4 w-4 rounded-full object-contain"
              />
              <span>{store.name}</span>
              <span className="opacity-60 text-[11px]">({store.count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Сетка купонов */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => item.element)}
        </div>
      ) : (
        <div className="rounded-2xl border border-line bg-paper/50 p-8 text-center my-6">
          <p className="font-display text-sm font-bold text-ink">
            По выбранным фильтрам предложений не найдено
          </p>
          <p className="text-xs text-ink/60 mt-1">
            Попробуйте выбрать другой магазин или сбросить фильтры.
          </p>
          <button
            type="button"
            onClick={() => {
              setActiveTab("all");
              setSelectedStore("all");
            }}
            className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-ink px-4 py-2 text-xs font-bold text-white hover:bg-ink/80 transition-all cursor-pointer"
          >
            Сбросить фильтры
          </button>
        </div>
      )}
    </div>
  );
}
