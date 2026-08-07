"use client";

import { useState } from "react";

type Msg =
  | { from: "bot" | "user"; text: string; link?: string; cta?: string }
  | { from: "bot"; text: string; link: string; cta: string };

type Item = { keys: string[]; answer: string; link?: string; cta?: string };

const KB: Item[] = [
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
    link: "/store",
    cta: "Открыть магазины",
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
      "Все активные магазины с купонами — в разделе «Магазины» внизу сайта или в футере. Сейчас это РИВ ГОШ, Отелло, Пятёрочка, Тануки, Start.ru, Carte Blanche, Ёбидоёби, Ив Роше и другие.",
    link: "/store",
    cta: "Открыть магазины",
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
    link: "/category",
    cta: "Открыть категории",
  },
  {
    keys: ["совет", "стать", "читать", "эконом"],
    answer:
      "У нас есть раздел «Советы по экономии» (35 статей): как тратить меньше на продукты, косметику, связь, ЖКХ и не только. Откройте раздел «Советы» в футере.",
    link: "/sovety",
    cta: "Читать советы",
  },
  {
    keys: ["партнёр", "бизнес", "юкасса", "yookassa", "net print", "netprint"],
    answer:
      "Для бизнеса у нас есть партнёрские разделы: ЮKassa (платежи без комиссии 90 дней) и Net Print (интерьерная печать со скидкой 30%). Открывайте «Партнёрам и бизнесу» на главной.",
    link: "/partner/yookassa",
    cta: "Партнёрам и бизнесу",
  },
  {
    keys: ["ив роше", "iv roche", "iv-roshe", "парфюм", "аромат", "духи"],
    answer:
      "У Ив Роше (iv-roshe) сейчас акции на свежие ароматы и косметику. Промокоды YRVM290 (минус 25% от 4000₽) и YRNM290 (минус 30% от 5000₽) суммируются с акциями.",
    link: "/store/iv-roshe",
    cta: "Открыть Ив Роше",
  },
  {
    keys: ["рив гош", "riv", "косметик"],
    answer:
      "РИВ ГОШ даёт скидку 10% от 6000₽ на первый и повторные заказы (код PFQ8W3XMT). Суммируется с акциями магазина.",
    link: "/store/riv-gosh",
    cta: "Открыть РИВ ГОШ",
  },
  {
    keys: ["тануки", "tanuki"],
    answer:
      "Тануки (TanukiFamily): скидка 20% от 1090₽ на первый заказ (20AV1474) и 15% от 1490₽ на повторные (15AV1474). Есть акция «ролл Чеддер в подарок».",
    link: "/store/tanukifamily",
    cta: "Открыть Тануки",
  },
  {
    keys: ["отелло", "otello"],
    answer:
      "Отелло: скидка 7% на повторное бронирование (до 4000₽, код JAR2-YR4A) и 15% на подборку (до 1500₽, код HOCHU-D8AP).",
    link: "/store/otello",
    cta: "Открыть Отелло",
  },
  {
    keys: ["пятёрочк", "pyaterochka", "пятерочк", "доставка продукт"],
    answer:
      "Пятёрочка Доставка: промокод a5w5yh74pr5 — скидка 55% на первый заказ от 700₽ (максимум 600₽). Не суммируется с акциями.",
    link: "/store/pyaterochka",
    cta: "Открыть Пятёрочку",
  },
  {
    keys: ["карте бланш", "carte blanche", "gala", "ювелир", "украшен"],
    answer:
      "Carte Blanche || Gala: скидка 10% на бренды Carte Blanche, GALA, Киндерсон на каждый заказ на Ozon (код SZHM93427848).",
    link: "/store/carte-blanche-gala",
    cta: "Открыть Carte Blanche",
  },
  {
    keys: ["start", "старт.ру", "кино", "подписк"],
    answer:
      "Start.ru: 30 дней доступа за 0₽ для новых пользователей (код pf5m0tdcgqx). Онлайн-кинотеатры и сервисы со скидкой — в статье «Подписки со скидкой».",
    link: "/store/start-ru",
    cta: "Открыть Start.ru",
  },
  {
    keys: ["ёбидоёби", "ебидоёби", "ebidoebi", "маркетплейс", "wb", "ozon", "озон", "вайлдберриз", "wildberries"],
    answer:
      "Ёбидоёби: скидка 20% от 1800₽ на первый заказ для блогеров (код BL7516PF). А на маркетплейсах Ozon и Wildberries купоны ищите в разделе «Маркетплейсы».",
    link: "/store/ebidoebi",
    cta: "Открыть Ёбидоёби",
  },
  {
    keys: ["цвет", "yandex", "яндекс цвет", "букет"],
    answer:
      "Яндекс.Цветы: доставка букетов с купонами. Все акции на странице магазина в разделе «Магазины».",
    link: "/store/yandeks-tsvety",
    cta: "Открыть Яндекс.Цветы",
  },
  {
    keys: ["одежд", "обув", "одеться", "шмот"],
    answer:
      "Скидки на одежду и обувь ловите в сезоны: зимние вещи дешевеют в марте-апреле, летние — в сентябре. Разбор — в статье «Скидки на одежду и обувь».",
    link: "/sovety/skidki-na-odezhdu-i-obuv",
    cta: "Читать статью",
  },
  {
    keys: ["аптек", "лекарств", "таблет", "болезн"],
    answer:
      "Экономить на лекарствах реально: дженерики вместо бренда, сравнение цен в приложениях, программы лояльности. Разбор — в статье «Как экономить на лекарствах».",
    link: "/sovety/skidki-na-lekarstva",
    cta: "Читать статью",
  },
  {
    keys: ["дет", "ребёнок", "ребенок", "школ", "детск"],
    answer:
      "Детские товары со скидкой ищите у маркетплейсов и в сезонные распродажи. Подборка — в статье «Детские товары со скидкой».",
    link: "/sovety/deti-so-skidkoy",
    cta: "Читать статью",
  },
  {
    keys: ["книг", "учеб", "литератур", "читать книг"],
    answer:
      "Скидки на книги и обучение бывают у издательств, на маркетплейсах и в подписках на чтение. Разбор — в статье «Скидки на книги и обучение».",
    link: "/sovety/skidki-na-knigi",
    cta: "Читать статью",
  },
  {
    keys: ["путешеств", "билет", "отпуск", "тур", "поездк"],
    answer:
      "Экономить на путешествиях реально: раннее бронирование, купоны на билеты, каршеринг. Разбор — в статьях «Как экономить на путешествиях» и «Экономия на путешествиях: авто-туры».",
    link: "/sovety/ekonomim-na-puteshestviyah-i-biletah",
    cta: "Читать статью",
  },
  {
    keys: ["связ", "тариф", "телефон сотов", "сим"],
    answer:
      "Счёт за связь режут семейные тарифы, отказ от лишних услуг и eSIM. Разбор — в статье «Как экономить на связи».",
    link: "/sovety/ekonomim-na-svyazi",
    cta: "Читать статью",
  },
  {
    keys: ["мебель", "дом", "ремонт", "интерьер"],
    answer:
      "Скидки на мебель и товары для дома ловите в сезоны распродаж и на витринных образцах. Разбор — в статье «Скидки на мебель и товары для дома».",
    link: "/sovety/skidki-na-mebel-i-tovary-dlya-doma",
    cta: "Читать статью",
  },
  {
    keys: ["возврат", "вернуть", "обмен"],
    answer:
      "При возврате товара промокод обычно не сгорает, но скидка пересчитывается на фактически оплаченную сумму. Детали — в статье «Возврат товара и скидка».",
    link: "/sovety/vozvrat-tovara-i-skidka",
    cta: "Читать статью",
  },
  {
    keys: ["чёрн", "распродаж", "black friday", "скидки когда"],
    answer:
      "Главные распродажи: Чёрная пятница (ноябрь), Новый год, летние и зимние сезоны. Как не переплатить — в статье «Как не переплатить на распродажах».",
    link: "/sovety/chernaya-pyatnica-2026",
    cta: "Читать статью",
  },
  {
    keys: ["доставк", "курьер", "самовывоз"],
    answer:
      "Скидки на доставку еды и продуктов — у Пятёрочки (55%), в ресторанах и на маркетплейсах. Советы — в статьях «Как экономить на доставке еды» и «Как экономить на продуктах».",
    link: "/sovety/ekonomim-na-dostavke-edy",
    cta: "Читать статью",
  },
  {
    keys: ["сертификат", "подарок"],
    answer:
      "Подарочные сертификаты можно купить дешевле номинала на маркетплейсах сертификатов. Разбор — в статье «Скидки на подарочные сертификаты».",
    link: "/sovety/podarochnye-sertifikaty-skidki",
    cta: "Читать статью",
  },
  {
    keys: ["льгот", "государств", "бесплатн", "пособ"],
    answer:
      "Бесплатные услуги и льготы от государства (медицина, ЖКХ, налоговый вычет) — в статье «Бесплатные услуги и льготы». Часто это ваши права, о которых не все знают.",
    link: "/sovety/besplatnye-uslugi-i-lgoty",
    cta: "Читать статью",
  },
  {
    keys: ["жкх", "коммуналк", "квартир"],
    answer:
      "Экономить на ЖКХ реально на 15-30%: счётчики, ночной тариф, льготы. Детали — в статье «Как экономить на ЖКХ».",
    link: "/sovety/ekonomim-na-zhkh",
    cta: "Читать статью",
  },
  {
    keys: ["техник", "электроник", "телефон", "ноутбук"],
    answer:
      "Промокоды на технику ищите у крупных ритейлеров и на маркетплейсах. Где искать — в статье «Промокоды на технику и электронику».",
    link: "/sovety/promokody-na-tehniku",
    cta: "Читать статью",
  },
];

const FALLBACK: Item = {
  keys: [],
  answer:
    "Не совсем понял вопрос 🤔 Уточните: вас интересует, как применить промокод, где его найти или почему он не сработал? Или напишите нам в ТГ @smart_zakupka — там подскажем быстрее.",
};

function pickBest(text: string): Item | typeof FALLBACK {
  const lower = text.toLowerCase();
  let best: { item: Item; score: number } | null = null;
  for (const item of KB) {
    const hits = item.keys.filter((k) => lower.includes(k)).length;
    if (hits === 0) continue;
    // магазины и конкретные бренды важнее общих фраз
    const isStore = !!item.link && item.link.startsWith("/store/");
    const score = hits * 10 + (isStore ? 5 : 0);
    if (!best || score > best.score) best = { item, score };
  }
  return best ? best.item : FALLBACK;
}

export default function ChatHelper() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      from: "bot",
      text: "Привет! Я помощник ПромоФакт. Спросите про магазин (Тануки, РИВ ГОШ, Пятёрочка), как применить промокод или где искать скидки.",
    },
  ]);
  const [input, setInput] = useState("");

  function send(text?: string) {
    const value = (text ?? input).trim();
    if (!value) return;
    const item = pickBest(value);
    const botMsg: Msg = {
      from: "bot",
      text: item.answer,
      ...(item.link ? { link: item.link } : {}),
      ...(item.cta ? { cta: item.cta } : {}),
    };
    setMsgs((m) => [...m, { from: "user", text: value }, botMsg]);
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
              <div key={i} className="space-y-1">
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.from === "bot" ? "bg-paper text-ink" : "ml-auto bg-red/10 text-ink"
                  }`}
                >
                  {m.text}
                </div>
                {"link" in m && m.link && (
                  <a
                    href={m.link}
                    className="block max-w-[85%] rounded-xl border border-mint/40 bg-mint/10 px-3 py-2 text-center text-xs font-bold text-ink hover:bg-mint/20"
                  >
                    {m.cta ?? "Перейти"} →
                  </a>
                )}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5 border-t border-line px-2 pt-2">
            {[
              "Как применить промокод",
              "Где магазины",
              "Пятёрочка",
              "Тануки",
              "РИВ ГОШ",
            ].map((q) => (
              <button
                key={q}
                onClick={() => {
                  send(q);
                }}
                className="rounded-full border border-line bg-paper px-2.5 py-1 text-xs text-ink/70 transition-colors hover:border-red hover:text-red"
              >
                {q}
              </button>
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
              onClick={() => {
                send();
              }}
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
