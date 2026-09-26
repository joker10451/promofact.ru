"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import StoreLogo from "@/components/StoreLogo";
import Icon from "@/components/Icon";
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

const POPULAR_SEARCH_TAGS = [
  "SUNLIGHT",
  "Пятёрочка",
  "Яндекс Цветы",
  "Отелло",
  "Кинопоиск",
  "Ив Роше",
  "Важная Рыба",
  "Fix Price",
];

export default function GlobalSearchModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [stores, setStores] = useState<SearchStore[]>([]);
  const [coupons, setCoupons] = useState<SearchCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const openSearch = useCallback(() => {
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      previouslyFocusedElement.current = document.activeElement;
    }
    setIsOpen(true);
    ymReachGoal("search_modal_open");
  }, []);

  const closeSearch = useCallback(() => {
    // Немедленно прерываем текущий сетевой запрос, если он выполняется
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    setIsOpen(false);
    setQuery("");
    setSelectedIndex(0);
    setLoading(false);

    // Возвращаем фокус на элемент, вызвавший поиск
    setTimeout(() => {
      if (previouslyFocusedElement.current && typeof previouslyFocusedElement.current.focus === "function") {
        previouslyFocusedElement.current.focus();
      }
    }, 50);
  }, []);

  // Слушаем события открытия поиска и горячие клавиши (Cmd/Ctrl + K, "/")
  useEffect(() => {
    const handleOpenEvent = () => openSearch();
    window.addEventListener("promo:open-search", handleOpenEvent);

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      } else if (e.key === "/" && !isOpen && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        openSearch();
      } else if (e.key === "Escape" && isOpen) {
        closeSearch();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("promo:open-search", handleOpenEvent);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, openSearch, closeSearch]);

  // Фокус на инпут при открытии и блокировка скролла
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = "";
    }
  }, [isOpen]);

  // Выполнение поиска с защитой от race conditions через AbortController
  useEffect(() => {
    if (!isOpen) {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      return;
    }

    // Отменяем предыдущий запрос при изменении query
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (!query.trim()) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      const controller = new AbortController();
      abortControllerRef.current = controller;
      queueMicrotask(() => setLoading(true));

      fetch("/api/search", { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          setStores(data.stores || []);
          setCoupons([]);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setLoading(false);
          }
        });
      return;
    }

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setLoading(true);

      const q = query.trim();
      fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal })
        .then((res) => res.json())
        .then((data) => {
          const foundStores = data.stores || [];
          const foundCoupons = data.coupons || [];
          setStores(foundStores);
          setCoupons(foundCoupons);
          setLoading(false);
          setSelectedIndex(0);
          // Безопасная аналитика: передаем только факт наличия результатов, без сырого query
          ymReachGoal("search_used", {
            source: "global_modal",
            has_results: foundStores.length > 0 || foundCoupons.length > 0,
            stores_count: foundStores.length,
            coupons_count: foundCoupons.length,
          });
        })
        .catch((err) => {
          if (err.name !== "AbortError") {
            setLoading(false);
          }
        });
    }, 180);

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [query, isOpen]);

  const allResults = [
    ...stores.map((s) => ({ type: "store" as const, data: s })),
    ...coupons.map((c) => ({ type: "coupon" as const, data: c })),
  ];

  const handleSelectResult = (index: number) => {
    const item = allResults[index];
    if (!item) return;

    if (item.type === "store") {
      ymReachGoal("search_store_click", { store: item.data.slug });
      router.push(`/store/${item.data.slug}`);
    } else {
      ymReachGoal("search_coupon_click", { store: item.data.storeSlug });
      router.push(`/store/${item.data.storeSlug}`);
    }
    closeSearch();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (allResults.length > 0 ? (prev + 1) % allResults.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (allResults.length > 0 ? (prev - 1 + allResults.length) % allResults.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (allResults.length > 0) {
        handleSelectResult(selectedIndex);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Поиск по магазинам и купонам"
      className="fixed inset-0 z-50 flex flex-col items-center justify-start bg-ink/75 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={closeSearch}
    >
      <div
        className="w-full max-w-2xl rounded-3xl bg-white shadow-2xl border border-line overflow-hidden flex flex-col max-h-[88vh] mt-4 sm:mt-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Поле ввода */}
        <div className="relative flex items-center border-b border-line px-4 py-3 sm:py-3.5 bg-paper/30">
          <span className="text-ink/40 mr-3 flex shrink-0 items-center justify-center">
            <Icon name="search" size={20} />
          </span>
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Магазин, бренд или промокод (например, SUNLIGHT, Самокат)..."
            className="w-full bg-transparent text-sm sm:text-base font-medium text-ink placeholder:text-ink/40 outline-none"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1.5 text-ink/40 hover:text-ink transition-colors mr-1 cursor-pointer"
              aria-label="Очистить поиск"
            >
              ✕
            </button>
          ) : null}
          <button
            type="button"
            onClick={closeSearch}
            className="rounded-xl bg-paper border border-line px-2.5 py-1 text-xs font-bold text-ink/60 hover:text-ink hover:border-ink/40 transition-all cursor-pointer shrink-0 ml-1"
          >
            ESC
          </button>
        </div>

        {/* Быстрые подсказки / Теги при пустом запросе */}
        {!query && (
          <div className="px-4 py-3 border-b border-line/60 bg-white">
            <span className="text-xs font-bold text-ink/50 uppercase tracking-wider block mb-2">
              Популярные магазины:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_SEARCH_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setQuery(tag)}
                  className="rounded-full bg-paper border border-line px-3 py-1 text-xs font-bold text-ink/75 hover:border-red hover:text-red transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Список результатов */}
        <div className="overflow-y-auto p-3 space-y-4 flex-1">
          {loading && (
            <div className="py-8 text-center text-xs font-bold text-ink/40">
              Поиск...
            </div>
          )}

          {!loading && query && allResults.length === 0 && (
            <div className="py-10 px-4 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper border border-line text-ink/40 mb-3">
                <Icon name="search" size={24} />
              </div>
              <p className="font-display text-sm font-bold text-ink">Ничего не найдено</p>
              <p className="text-xs text-ink/60 mt-1 max-w-sm mx-auto">
                По запросу «{query}» нет активных предложений. Проверьте правильность написания или выберите популярный бренд.
              </p>
            </div>
          )}

          {/* Секция магазинов */}
          {stores.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                {query ? "Магазины" : "Часто ищут"}
              </div>
              <div className="mt-1 space-y-1">
                {stores.map((s, idx) => {
                  const isSelected = selectedIndex === idx;
                  return (
                    <Link
                      key={s.slug}
                      href={`/store/${s.slug}`}
                      onClick={() => {
                        ymReachGoal("search_store_click", { store: s.slug });
                        closeSearch();
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl p-2.5 sm:px-3 sm:py-2.5 transition-all ${
                        isSelected ? "bg-red/10 border border-red/30" : "hover:bg-paper"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line/60 bg-white p-1">
                          <StoreLogo
                            slug={s.slug}
                            name={s.name}
                            logo={s.logo}
                            size={36}
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                        <div className="min-w-0">
                          <div className="font-display text-sm font-bold text-ink truncate">
                            {s.name}
                          </div>
                          <div className="text-xs text-ink/50 truncate font-medium">
                            {s.category}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="rounded-full bg-paper border border-line px-2 py-0.5 text-[11px] font-bold text-ink/70">
                          {s.couponCount} {s.couponCount === 1 ? "акция" : s.couponCount < 5 ? "акции" : "акций"}
                        </span>
                        <span className="text-xs font-bold text-red hidden sm:inline">Перейти →</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Секция промокодов */}
          {coupons.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-ink/40">
                Предложения и промокоды
              </div>
              <div className="mt-1 space-y-1">
                {coupons.map((c, idx) => {
                  const realIdx = stores.length + idx;
                  const isSelected = selectedIndex === realIdx;
                  return (
                    <Link
                      key={c.id}
                      href={`/store/${c.storeSlug}`}
                      onClick={() => {
                        ymReachGoal("search_coupon_click", { store: c.storeSlug });
                        closeSearch();
                      }}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl p-2.5 sm:px-3 sm:py-2.5 transition-all ${
                        isSelected ? "bg-red/10 border border-red/30" : "hover:bg-paper"
                      }`}
                    >
                      <div className="min-w-0 pr-3">
                        <div className="text-xs font-bold text-ink/60 truncate">
                          {c.storeName}
                        </div>
                        <div className="text-sm font-bold text-ink truncate mt-0.5">
                          {c.bonusName}
                        </div>
                      </div>
                      <span className="shrink-0 rounded-xl bg-paper border border-dashed border-ink/20 px-2.5 py-1 font-mono text-xs font-bold text-red">
                        {c.code}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Подвал поиска */}
        <div className="border-t border-line px-4 py-2.5 bg-paper/40 text-[11px] text-ink/50 flex items-center justify-between">
          <span>Нажмите <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-line">↵ Enter</kbd> для перехода</span>
          <span><kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-line">↑</kbd> <kbd className="font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-line">↓</kbd> выбор</span>
        </div>
      </div>
    </div>
  );
}
