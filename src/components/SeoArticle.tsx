"use client";

import { useState } from "react";

export default function SeoArticle() {
  const [expanded, setExpanded] = useState(false);

  return (
    <section className="py-10 border-t border-line">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-xs">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg sm:text-xl font-bold text-ink">
                О сервисе ПРОМО·ФАКТ
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-ink/60 font-medium">
                Как мы отбираем промокоды и почему они реально работают
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 text-xs sm:text-sm font-bold text-red hover:text-red-dark transition-colors cursor-pointer"
            >
              {expanded ? "Свернуть ↑" : "Читать подробнее ↓"}
            </button>
          </div>

          <p className="mt-4 text-xs sm:text-sm leading-relaxed text-ink/70">
            Промокоды — самый простой способ сэкономить на онлайн-покупках, но проблема
            в том, что большинство кодов из интернета уже не работают. Мы решили это:
            каждый купон на ПРОМО·ФАКТ проходит регулярную проверку, а истёкшие акции
            удаляются своевременно.
          </p>

          {expanded && (
            <div className="mt-6 pt-6 border-t border-line/60 space-y-5 text-xs sm:text-sm leading-relaxed text-ink/75">
              <div>
                <h3 className="font-display text-sm font-bold text-ink">
                  Где искать рабочие промокоды в 2026 году
                </h3>
                <p className="mt-1.5">
                  Лучшие промокоды появляются у крупных сетей и маркетплейсов: Самокат,
                  РИВ ГОШ, Золотое Яблоко, Пятёрочка, Тануки, Кинопоиск и Отелло. Мы держим
                  руку на пульсе и добавляем новые купоны в день запуска, чтобы вы успевали
                  воспользоваться скидкой.
                </p>
              </div>

              <div>
                <h3 className="font-display text-sm font-bold text-ink">
                  Как найти промокод, который подходит именно вам
                </h3>
                <p className="mt-1.5">
                  Воспользуйтесь поиском или быстрым фильтром по категориям: еда, косметика,
                  одежда, электроника, дом и путешествия. В каждой карточке указаны условия —
                  минимальная сумма заказа, срок действия и ограничения.
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
                ПРОМО·ФАКТ бесплатен для посетителей: мы зарабатываем на партнёрских
                комиссиях магазинов, а не на вашей скидке. Добавляйте сайт в закладки и
                проверяйте свежие купоны перед каждой покупкой.
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
