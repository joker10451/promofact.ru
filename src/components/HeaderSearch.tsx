"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ymReachGoal } from "@/components/YandexMetrika";

interface SearchStore {
  name: string;
  slug: string;
  logo: string | null;
  category: string;
  couponCount: number;
}

interface SearchCoupon {
  id: number;
  code: string;
  bonusName: string;
  storeName: string;
  storeSlug: string;
  storeLogo: string | null;
  isHit: boolean;
}

export default function HeaderSearch() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [stores, setStores] = useState<SearchStore[]>([]);
  const [coupons, setCoupons] = useState<SearchCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      fetch("/api/search")
        .then((res) => res.json())
        .then((data) => {
          setStores(data.stores || []);
          setCoupons([]);
        })
        .catch(() => {});
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
        .then((res) => res.json())
        .then((data) => {
          setStores(data.stores || []);
          setCoupons(data.coupons || []);
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleFocus = () => {
    setIsOpen(true);
    ymReachGoal("header_search_focus");
  };

  const handleSelect = () => {
    setIsOpen(false);
    setQuery("");
    ymReachGoal("header_search_select");
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xs md:max-w-sm">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={handleFocus}
          placeholder="Поиск магазина или промокода…"
          className="w-full rounded-full border-2 border-line bg-white/90 px-4 py-1.5 pl-9 pr-8 text-xs sm:text-sm text-ink outline-none transition-all placeholder:text-ink/40 focus:border-red focus:bg-white focus:shadow-md"
        />
        <svg
          viewBox="0 0 24 24"
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 top-1/2 -translate-y-1/2 text-ink/40 pointer-events-none"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-ink/40 hover:text-ink"
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-2 max-h-[75vh] sm:max-h-96 overflow-y-auto rounded-2xl border border-line bg-white p-3 shadow-2xl z-50 animate-fadeIn">
          {loading && (
            <div className="py-4 text-center text-xs text-ink/50">
              Поиск предложений...
            </div>
          )}

          {!loading && stores.length === 0 && coupons.length === 0 && (
            <div className="py-6 text-center text-xs text-ink/50">
              Ничего не найдено по запросу «{query}»
            </div>
          )}

          {!loading && stores.length > 0 && (
            <div className="mb-3">
              <div className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-wider text-ink/45">
                {query ? "Магазины" : "Популярные магазины"}
              </div>
              <div className="space-y-1">
                {stores.map((store) => (
                  <Link
                    key={store.slug}
                    href={`/store/${store.slug}`}
                    onClick={handleSelect}
                    className="flex items-center justify-between rounded-xl px-2.5 py-1.5 text-xs hover:bg-paper transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      {store.logo ? (
                        <img
                          src={store.logo}
                          alt={store.name}
                          className="h-5 w-5 rounded-full object-contain bg-white"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-ink/5 text-[9px] font-extrabold">
                          {store.name.slice(0, 1)}
                        </div>
                      )}
                      <span className="font-bold text-ink">{store.name}</span>
                    </div>
                    <span className="text-[11px] font-medium text-ink/40">
                      {store.couponCount}{" "}
                      {store.couponCount === 1 ? "купон" : "купонов"}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {!loading && coupons.length > 0 && (
            <div>
              <div className="mb-1.5 px-2 text-[10px] font-extrabold uppercase tracking-wider text-ink/45">
                Промокоды
              </div>
              <div className="space-y-1">
                {coupons.map((coupon) => (
                  <Link
                    key={coupon.id}
                    href={`/store/${coupon.storeSlug}/${encodeURIComponent(coupon.code)}`}
                    onClick={handleSelect}
                    className="flex flex-col gap-0.5 rounded-xl px-2.5 py-2 hover:bg-paper transition-colors"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="rounded bg-yellow/30 border border-yellow/60 px-1.5 py-0.5 font-mono text-[11px] font-extrabold text-ink">
                          {coupon.code}
                        </span>
                        <span className="text-xs font-bold text-ink">
                          {coupon.storeName}
                        </span>
                      </div>
                      {coupon.isHit && (
                        <span className="rounded-full bg-red/10 px-2 py-0.5 text-[9px] font-extrabold text-red">
                          ХИТ
                        </span>
                      )}
                    </div>
                    <p className="line-clamp-1 text-[11px] text-ink/60">
                      {coupon.bonusName}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
