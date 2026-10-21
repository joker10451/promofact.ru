"use client";

import { useState } from "react";

export default function SeoArticle() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="border-t border-line">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ink">
                О сервисе ПРОМО·ФАКТ
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-ink/60 font-medium">
                Откуда берутся предложения и как проверять их условия
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 min-h-[44px] inline-flex items-center px-2 py-2 text-xs sm:text-sm font-bold text-red hover:text-red-dark transition-colors cursor-pointer"
            >
              {expanded ? "Свернуть ↑" : "Читать подробнее ↓"}
            </button>
          </div>

          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-ink/70">
            На ПРОМО·ФАКТ собраны предложения из партнёрских программ магазинов.
            Акции с истёкшей указанной датой скрываются автоматически, но это
            не подтверждает, что промокод подойдёт именно вашему заказу.
            Перед покупкой сверьте ограничения и окончательную цену в магазине.
          </p>

          {expanded && (
            <div className="mt-6 pt-6 border-t border-line/60 space-y-5 text-xs sm:text-sm leading-relaxed text-ink/75">
              <div>
                <h3 className="font-display text-sm font-bold text-ink">
                  Где искать предложения магазинов
                </h3>
                <p className="mt-1.5">
                  Ищите предложения по названию магазина или тематике. В каталоге
                  представлены разные категории: доставка, косметика, одежда, обучение,
                  путешествия и подписки. Состав меняется по мере обновления данных
                  партнёрских программ; наличие конкретной акции не гарантируется.
                </p>
              </div>

              <div>
                <h3 className="font-display text-sm font-bold text-ink">
                  Как найти промокод, который подходит именно вам
                </h3>
                <p className="mt-1.5">
                  Воспользуйтесь поиском или быстрым фильтром по категориям: еда, косметика,
                  одежда, электроника, дом и путешествия. Изучите доступные условия
                  в карточке: срок действия и ограничения, если их передал партнёр.
                  Уточните недостающие детали на сайте магазина.
                </p>
              </div>

              <div>
                <h3 className="font-display text-sm font-bold text-ink">
                  Почему купон может не сработать и что делать
                </h3>
                <p className="mt-1.5">
                  Чаще всего промокод не применяется из-за невыполненных условий: промоакция
                  только для новых клиентов, код не суммируется с распродажей или не подходит
                  на определённые бренды. Внимательно читайте условия в карточке купона.
                </p>
              </div>

              <div className="rounded-xl border border-line bg-paper p-4 text-xs text-ink/70">
                ПРОМО·ФАКТ бесплатен для посетителей. При подтверждённой покупке
                по партнёрской ссылке мы можем получать комиссию по правилам
                конкретной программы. Скидку и её ограничения определяет магазин.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
