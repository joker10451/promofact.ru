"use client";

import { useState } from "react";

type Msg = { from: "bot" | "user"; text: string };

const KB: { keys: string[]; answer: string }[] = [
  {
    keys: ["не работает", "не сработал", "не применяется", "ошибка", "почему нет"],
    answer:
      "Чаще всего промокод не срабатывает из-за условий: истёк срок, действует только для новых клиентов, требует минимальной суммы заказа или не суммируется с распродажей. Все ограничения указаны в карточке купона. Прочитайте их перед переходом в магазин.",
  },
  {
    keys: ["как применить", "как использовать", "куда вставлять", "вставить код", "где вводить"],
    answer:
      'Скопируйте код кнопкой «Копировать» на странице магазина, перейдите в магазин по нашей ссылке и вставьте код в поле «Промокод» на этапе оплаты. Скидка применится сразу, обычно её видно до подтверждения заказа.',
  },
  {
    keys: ["скопировать", "копирование", "скопируй"],
    answer:
      "Рядом с каждым кодом есть кнопка «Копировать». Нажмите её — код попадёт в буфер обмена. Потом вставьте его в магазине (Ctrl+V или правой кнопкой мыши).",
  },
  {
    keys: ["где искать", "где взять", "откуда", "где найти"],
    answer:
      "Актуальные купоны мы собираем на страницах магазинов и обновляем каждый день. Заходите в раздел «Магазины» или ищите свой магазин через поиск на главной. Истёкшие коды убираем сразу.",
  },
  {
    keys: ["сколько стоит", "платно", "цена", "деньги"],
    answer:
      "Все промокоды на ПромоФакт бесплатны. Мы зарабатываем на партнёрских ссылках: если вы закажете что-то по нашей ссылке, магазин заплатит нам комиссию. На размер вашей скидки это не влияет.",
  },
  {
    keys: ["кэшбэк", "возврат", "вернут"],
    answer:
      "Кэшбэк зависит от банка и магазина. Подборку по банкам ищите в статье «Кэшбэк банков 2026», а по продуктам — в «Кэшбэк на продукты». Это отдельная выгода, которую можно сложить с промокодом.",
  },
  {
    keys: ["магазин", "магазины", "список"],
    answer:
      "Все активные магазины с купонами — в разделе «Магазины» внизу сайта или в футере. Сейчас это РИВ ГОШ, Отелло, Пятёрочка, Тануки, Start.ru, Carte Blanche, Ёбидоёби и другие.",
  },
  {
    keys: ["подписка", "уведомлени", "рассылка"],
    answer:
      "Подпишитесь на наш ТГ-канал @smart_zakupka — там свежие купоны каждый день. А на сайте заходите раз в несколько дней: истёкшие коды мы убираем сразу.",
  },
  {
    keys: ["категор", "тем", "раздел"],
    answer:
      "Купоны разбиты по категориям: доставка продуктов, косметика, путешествия, маркетплейсы, кино, ювелирные изделия и др. Откройте «Категории» в футере и выберите свою.",
  },
  {
    keys: ["совет", "стать", "читать", "эконом"],
    answer:
      "У нас есть раздел «Советы по экономии» (35 статей): как тратить меньше на продукты, косметику, связь, ЖКХ и не только. Откройте раздел «Советы» в футере.",
  },
  {
    keys: ["партнёр", "бизнес", "юкасса", "yookassa", "net print", "netprint"],
    answer:
      "Для бизнеса у нас есть партнёрские разделы: ЮKassa (платежи без комиссии 90 дней) и Net Print (интерьерная печать со скидкой 30%). Открывайте «Партнёрам и бизнесу» на главной.",
  },
];

const FALLBACK =
  "Не совсем понял вопрос 🤔 Уточните: вас интересует, как применить промокод, где его найти или почему он не сработал? Или напишите нам в ТГ @smart_zakupka — там подскажем быстрее.";

function findAnswer(text: string): string {
  const lower = text.toLowerCase();
  for (const item of KB) {
    if (item.keys.some((k) => lower.includes(k))) return item.answer;
  }
  return FALLBACK;
}

export default function ChatHelper() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "bot",
      text: "Привет! Я помощник ПромоФакт. Спросите, как применить промокод, где его найти или почему он не сработал.",
    },
  ]);
  const [input, setInput] = useState("");

  function send() {
    const text = input.trim();
    if (!text) return;
    const answer = findAnswer(text);
    setMsgs((m) => [...m, { from: "user", text }, { from: "bot", text: answer }]);
    setInput("");
  }

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Открыть помощника"
        className="fixed bottom-4 right-4 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-red text-2xl text-white shadow-lg transition-transform hover:scale-105"
      >
        {open ? "×" : "💬"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 z-50 flex max-h-[70vh] w-[min(92vw,360px)] flex-col rounded-2xl border border-line bg-white shadow-xl">
          <div className="rounded-t-2xl bg-ink px-4 py-3 text-sm font-bold text-white">
            Помощник ПромоФакт
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {msgs.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                  m.from === "bot"
                    ? "bg-paper text-ink"
                    : "ml-auto bg-red/10 text-ink"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="flex gap-2 border-t border-line p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ваш вопрос…"
              className="flex-1 rounded-full border border-line bg-paper px-3 py-2 text-sm outline-none focus:border-red"
            />
            <button
              onClick={send}
              className="rounded-full bg-red px-4 py-2 text-sm font-bold text-white"
            >
              ➤
            </button>
          </div>
          <a
            href="https://t.me/smart_zakupka"
            target="_blank"
            rel="noopener nofollow"
            className="block rounded-b-2xl bg-mint/10 px-4 py-2 text-center text-xs font-semibold text-ink/70 hover:text-ink"
          >
            Или напишите в ТГ @smart_zakupka
          </a>
        </div>
      )}
    </>
  );
}
