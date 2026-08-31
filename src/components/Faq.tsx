"use client";

import { useState } from "react";

const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Промокоды на сайте правда работают?",
    a: "Да. Мы регулярно проверяем каждый промокод и сразу убираем неработающие акции. Если код не применился — напишите нам, мы найдем замену или обновим информацию.",
  },
  {
    q: "Как применить промокод в интернет-магазине?",
    a: "Скопируй код кнопкой «Копировать», перейди в магазин по нашей ссылке, добавь товары в корзину и вставь код в поле «Промокод» на этапе оплаты. Скидка применится сразу, обычно её видно до оплаты.",
  },
  {
    q: "Почему промокод не работает?",
    a: "Причин несколько: купон истёк, подходит только для новых клиентов, не суммируется с распродажей или требует минимальной суммы заказа. Все условия указаны в описании купона — читай перед переходом.",
  },
  {
    q: "Сколько стоят промокоды?",
    a: "Всё бесплатно. Мы зарабатываем на партнёрских CPA-ссылках: если ты совершишь заказ по нашей ссылке, магазин платит нам комиссию. На твою скидку это никак не влияет.",
  },
  {
    q: "Вы отслеживаете мои заказы?",
    a: "Партнёрская система Perfluence фиксирует только факт заказа по нашей ссылке для начисления комиссии. Мы не видим, что именно ты купил, и не передаём данные третьим лицам.",
  },
  {
    q: "Как часто обновляются купоны?",
    a: "Каждый день. Новые промокоды появляются по мере выхода акций у магазинов, а истёкшие — удаляются автоматически по дате окончания и после проверки.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-24">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-center font-display text-2xl sm:text-3xl font-extrabold">
          Частые вопросы
        </h2>
        <div className="mt-8 space-y-3">
          {FAQ_ITEMS.map((item, i) => {
            const isOpen = open === i;
            return (
              <div
                key={item.q}
                className={`bg-white border border-line rounded-2xl transition-shadow ${
                  isOpen ? "shadow-offset border-yellow/60" : ""
                }`}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="font-bold">{item.q}</span>
                  <span
                    className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-lg font-bold transition-transform duration-300 ${
                      isOpen ? "bg-yellow rotate-45" : "bg-paper"
                    }`}
                    aria-hidden="true"
                  >
                    +
                  </span>
                </button>
                <div
                  className={`grid transition-all duration-300 ${
                    isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <p className="px-5 pb-5 text-sm leading-relaxed text-ink/70">{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
