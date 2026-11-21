"use client";

import Icon from "@/components/Icon";
import { useState, useEffect } from "react";

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
      'Скопируйте код кнопкой «Копировать» на странице магазина, перейдите в магазин по нашей ссылке и вставьте код в поле «Промокод» на этапе оплаты. Если магазин принимает код и условия выполнены, скидка должна отобразиться в итоговой цене. Проверьте её до оплаты.',
  },
  {
    keys: ["скопировать", "копирование", "скопируй"],
    answer:
      "Рядом с каждым кодом есть кнопка «Копировать». Нажмите её — код попадёт в буфер обмена. Потом вставьте его в магазине (Ctrl+V или правой кнопкой мыши).",
  },
  {
    keys: ["где искать", "где взять", "откуда", "где найти"],
    answer:
      "Предложения собираются из партнёрских источников и могут меняться. Заходите в раздел «Магазины» или используйте поиск на главной, затем проверяйте срок и условия в карточке и у магазина.",
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
      "Кэшбэк зависит от банка и магазина. Подборку по банкам ищите в статье «Кэшбэк банков 2026», а по продуктам — в «Кэшбэк на продукты». Совмещение кэшбэка и промокода зависит от правил банка и магазина; проверьте их до оплаты.",
  },
  {
    keys: ["магазин", "магазины", "список"],
    answer:
      "Все активные магазины с купонами — в разделе «Магазины» внизу сайта или в футере. Список магазинов зависит от наличия разрешённых к публикации предложений. Откройте каталог, чтобы увидеть доступные варианты.",
    link: "/store",
    cta: "Открыть магазины",
  },
  {
    keys: ["подписка", "уведомлени", "рассылка"],
    answer:
      "Подпишитесь на наш ТГ-канал @smart_zakupka — там свежие купоны каждый день. На сайте проверяйте сроки в карточках: рекламодатели могут менять условия акций.",
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
    keys: ["ив роше", "iv roche", "iv-roshe", "парфюм", "аромат", "духи"],
    answer:
      "Предложения Ив Роше на косметику и ароматы смотрите на странице магазина. Проверьте ограничения по товарам, срок действия и возможность совмещения скидок.",
    link: "/store/iv-roshe",
    cta: "Открыть Ив Роше",
  },
  {
    keys: ["рив гош", "riv", "косметик"],
    answer:
      "Промокоды РИВ ГОШ и условия для новых или постоянных клиентов смотрите в карточках магазина. Совмещение с другими акциями проверяйте перед оплатой.",
    link: "/store/riv-gosh",
    cta: "Открыть РИВ ГОШ",
  },
  {
    keys: ["тануки", "tanuki"],
    answer:
      "В Тануки предложения для первого и повторного заказов отличаются. Посмотрите текущие коды, минимальный чек и доступные города на странице магазина.",
    link: "/store/tanukifamily",
    cta: "Открыть Тануки",
  },
  {
    keys: ["отелло", "otello"],
    answer:
      "Предложения Отелло на бронирование зависят от дат, выбранного отеля и статуса клиента. Текущие условия смотрите на странице магазина.",
    link: "/store/otello",
    cta: "Открыть Отелло",
  },
  {
    keys: ["пятёрочк", "pyaterochka", "пятерочк", "доставка продукт"],
    answer:
      "В Пятёрочке Доставка могут быть отдельные промокоды на первый заказ. Проверьте срок, порог заказа, максимальную скидку и исключения в карточке предложения.",
    link: "/store/pyaterochka",
    cta: "Открыть Пятёрочку",
  },
  {
    keys: ["карте бланш", "carte blanche", "gala", "ювелир", "украшен"],
    answer:
      "Предложения Carte Blanche || Gala для маркетплейсов и их ограничения смотрите на странице проекта: ассортимент, условия и коды могут меняться.",
    link: "/store/carte-blanche-gala",
    cta: "Открыть Carte Blanche",
  },
  {
    keys: ["start", "старт.ру", "кино", "подписк"],
    answer:
      "Акции Start.ru могут отличаться по сроку пробного периода и категории пользователей. Уточните текущий код, стоимость после акции и автопродление перед оформлением.",
    link: "/store/start-ru",
    cta: "Открыть Start.ru",
  },
  {
    keys: ["ёбидоёби", "ебидоёби", "ebidoebi", "маркетплейс", "wb", "ozon", "озон", "вайлдберриз", "wildberries"],
    answer:
      "Предложения сети доставки смотрите в карточках проекта. Для скидки проверьте актуальное название магазина, условия первого заказа и сумму корзины.",
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
    link: "/category/odezhda-i-obuv",
    cta: "Читать статью",
  },
  {
    keys: ["аптек", "лекарств", "таблет", "болезн"],
    answer:
      "Экономить на лекарствах реально: дженерики вместо бренда, сравнение цен в приложениях, программы лояльности. Разбор — в статье «Как экономить на лекарствах».",
    link: "/collections/apteki-i-zdorove",
    cta: "Читать статью",
  },
  {
    keys: ["дет", "ребёнок", "ребенок", "школ", "детск"],
    answer:
      "Детские товары со скидкой ищите у маркетплейсов и в сезонные распродажи. Подборка — в статье «Детские товары со скидкой».",
    link: "/category/detskie-tovary",
    cta: "Читать статью",
  },
  {
    keys: ["книг", "учеб", "литератур", "читать книг"],
    answer:
      "Скидки на книги и обучение бывают у издательств, на маркетплейсах и в подписках на чтение. Разбор — в статье «Скидки на книги и обучение».",
    link: "/category/onlayn-obrazovanie",
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
    link: "/category/svyaz-i-internet",
    cta: "Читать статью",
  },
  {
    keys: ["мебель", "дом", "ремонт", "интерьер"],
    answer:
      "Скидки на мебель и товары для дома ловите в сезоны распродаж и на витринных образцах. Разбор — в статье «Скидки на мебель и товары для дома».",
    link: "/category/vse-dlya-doma",
    cta: "Читать статью",
  },
  {
    keys: ["возврат", "вернуть", "обмен"],
    answer:
      "При возврате товара промокод обычно не сгорает, но скидка пересчитывается на фактически оплаченную сумму. Детали — в статье «Возврат товара и скидка».",
    link: "/sovety/chto-takoe-promokod",
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
      "Скидки на доставку еды и продуктов зависят от города, первого или повторного заказа и суммы корзины. Ищите действующие варианты в каталоге и сверяйте условия с магазином.",
    link: "/sovety/kak-ekonomit-na-produktah",
    cta: "Читать статью",
  },
  {
    keys: ["сертификат", "подарок"],
    answer:
      "Подарочные сертификаты можно купить дешевле номинала на маркетплейсах сертификатов. Разбор — в статье «Скидки на подарочные сертификаты».",
    link: "/category/raznoe",
    cta: "Читать статью",
  },
  {
    keys: ["льгот", "государств", "бесплатн", "пособ"],
    answer:
      "Бесплатные услуги и льготы от государства (медицина, ЖКХ, налоговый вычет) — в статье «Бесплатные услуги и льготы». Часто это ваши права, о которых не все знают.",
    link: "/sovety/kak-ekonomit-v-internete",
    cta: "Читать статью",
  },
  {
    keys: ["жкх", "коммуналк", "квартир"],
    answer:
      "Экономить на ЖКХ реально на 15-30%: счётчики, ночной тариф, льготы. Детали — в статье «Как экономить на ЖКХ».",
    link: "/sovety/kak-ekonomit-na-produktah",
    cta: "Читать статью",
  },
  {
    keys: ["техник", "электроник", "телефон", "ноутбук"],
    answer:
      "Промокоды на технику ищите у крупных ритейлеров и на маркетплейсах. Где искать — в разделе каталога «Электроника и техника».",
    link: "/category/elektronika-i-tehnika",
    cta: "Читать статью",
  },
];

const FALLBACK: Item = {
  keys: [],
  answer:
    "Не совсем понял вопрос. Уточните: вас интересует, как применить промокод, где его найти или почему он не сработал? Или напишите нам в ТГ @smart_zakupka — там подскажем быстрее.",
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
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [isScrollingDown, setIsScrollingDown] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Отслеживание визуального вьюпорта (виртуальной клавиатуры на смартфонах)
    const handleResize = () => {
      if (window.visualViewport) {
        const isShrunk = window.visualViewport.height < window.innerHeight * 0.75;
        setIsKeyboardOpen(isShrunk);
      }
    };

    // 2. Отслеживание фокуса на полях ввода страницы (поиск, внешние формы)
    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) {
        // Если фокус не внутри самого помощника
        if (!target.closest("[data-chat-helper]")) {
          setIsKeyboardOpen(true);
        }
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const active = document.activeElement as HTMLElement | null;
        if (!active || (active.tagName !== "INPUT" && active.tagName !== "TEXTAREA")) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    // 3. Автоматическое скрытие при скролле вниз, чтобы гарантированно не перекрывать CTA карточек
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY + 10 && currentScrollY > 50) {
        setIsScrollingDown(true);
      } else if (currentScrollY < lastScrollY - 10 || currentScrollY <= 50) {
        setIsScrollingDown(false);
      }
      lastScrollY = currentScrollY;
    };

    window.visualViewport?.addEventListener("resize", handleResize);
    window.addEventListener("focusin", handleFocusIn);
    window.addEventListener("focusout", handleFocusOut);
    window.addEventListener("scroll", handleScroll, { passive: true });

    // An input may receive focus before React hydration attaches focusin.
    // Recover its current state so the mobile helper cannot obscure a CTA.
    const focused = document.activeElement as HTMLElement | null;
    let initialFocusFrame: number | undefined;
    if (focused && (focused.tagName === "INPUT" || focused.tagName === "TEXTAREA") &&
        !focused.closest("[data-chat-helper]")) {
      initialFocusFrame = requestAnimationFrame(() => {
        const active = document.activeElement as HTMLElement | null;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA") &&
            !active.closest("[data-chat-helper]")) setIsKeyboardOpen(true);
      });
    }

    return () => {
      if (initialFocusFrame !== undefined) cancelAnimationFrame(initialFocusFrame);
      window.visualViewport?.removeEventListener("resize", handleResize);
      window.removeEventListener("focusin", handleFocusIn);
      window.removeEventListener("focusout", handleFocusOut);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

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

  // На смартфонах при открытой клавиатуре скрываем плавающую кнопку
  const shouldHideTrigger = isKeyboardOpen && !open;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Открыть помощника"
        className={`fixed z-40 flex items-center justify-center bg-red text-white shadow-lg transition-all duration-200 cursor-pointer ${
          shouldHideTrigger ? "hidden" : ""
        } ${
          isScrollingDown && !open
            ? "translate-x-full opacity-0 pointer-events-none md:translate-x-0 md:opacity-100 md:pointer-events-auto"
            : "translate-x-0 opacity-100"
        } right-0 bottom-[68px] rounded-l-2xl py-2 px-2.5 md:bottom-4 md:right-4 md:h-11 md:gap-2 md:rounded-full md:px-4 md:py-0 hover:scale-105 active:scale-95`}
      >
        {open ? <Icon name="close" size={18} /> : <Icon name="bulb" size={18} />}
        {/* Подпись на десктопе: безымянный красный круг читался как непонятная реклама. */}
        {!open && <span className="hidden text-sm font-bold md:inline">Помощь</span>}
      </button>

      {open && (
        <div
          data-chat-helper="true"
          className="fixed bottom-[68px] left-3 right-3 z-50 flex max-h-[min(65vh,480px)] sm:left-auto sm:right-4 sm:w-[360px] md:bottom-20 md:max-h-[70vh] flex-col rounded-3xl border border-line bg-white shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-150"
        >
          <div className="flex items-center justify-between bg-ink px-4 py-3 text-sm font-bold text-white">
            <span>Помощник ПромоФакт</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 text-white/60 hover:text-white transition-colors cursor-pointer"
              aria-label="Закрыть помощника"
            >
              <Icon name="close" size={16} />
            </button>
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
              className="rounded-full bg-red px-4 py-2 text-sm font-bold text-white cursor-pointer"
            >
              <Icon name="send" size={15} />
            </button>
          </div>
          <a
            href="https://t.me/smart_zakupka"
            target="_blank"
            rel="noopener nofollow"
            className="block bg-mint/10 px-4 py-2 text-center text-xs font-semibold text-ink/70 hover:text-ink"
          >
            Или напишите в ТГ @smart_zakupka
          </a>
        </div>
      )}
    </>
  );
}
