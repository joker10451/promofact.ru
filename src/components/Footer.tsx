import Link from "next/link";
import { getCategories, getStores } from "@/lib/perfluence";
import { SITE_NAME } from "@/lib/site";

export default async function Footer() {
  const categories = await getCategories();
  const stores = (await getStores()).slice(0, 12);

  return (
    <footer className="bg-ink text-white">
      <div className="h-1.5 w-full bg-gradient-to-r from-yellow via-red to-mint" />
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2 font-display text-xl font-extrabold">
            <img
              src="/icon.svg"
              alt="ПРОМО·ФАКТ"
              width={28}
              height={28}
              className="h-7 w-7"
            />
            ПРОМО<span className="text-red">·</span>ФАКТ
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
            Проверенные промокоды и купоны на скидку от магазинов-партнёров.
            Обновляем каждый день, проверяем каждый код.
          </p>
        </div>

        {categories.length > 0 && (
          <nav aria-label="Категории">
            <div className="font-display text-xs font-extrabold uppercase tracking-widest text-yellow">
              Категории
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              {categories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    href={`/category/${cat.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
              <Link
                href="/sovety"
                className="mt-4 inline-block font-semibold text-white/70 hover:text-white transition-colors"
              >
                Советы по экономии →
              </Link>
            </nav>
        )}

        <nav aria-label="Подборки">
          <div className="font-display text-xs font-extrabold uppercase tracking-widest text-yellow">
            Подборки
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li>
              <Link
                href="/collections/first-order"
                className="hover:text-white transition-colors"
              >
                Скидки на первый заказ
              </Link>
            </li>
            <li>
              <Link
                href="/collections/food-delivery"
                className="hover:text-white transition-colors"
              >
                Доставка еды и продуктов
              </Link>
            </li>
            <li>
              <Link
                href="/collections/exclusive"
                className="hover:text-white transition-colors"
              >
                Эксклюзивные промокоды
              </Link>
            </li>
          </ul>
        </nav>

        {stores.length > 0 && (
          <nav aria-label="Магазины">
            <div className="font-display text-xs font-extrabold uppercase tracking-widest text-yellow">
              Магазины
            </div>
            <ul className="mt-4 space-y-2.5 text-sm text-white/70">
              {stores.map((store) => (
                <li key={store.slug}>
                  <Link
                    href={`/store/${store.slug}`}
                    className="hover:text-white transition-colors"
                  >
                    {store.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <div>
          <div className="font-display text-xs font-extrabold uppercase tracking-widest text-yellow">
            Партнёрам
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            <li>
              <a
                href="https://perfluence.net"
                target="_blank"
                rel="noopener nofollow sponsored"
                className="hover:text-white transition-colors"
              >
                Perfluence — CPA-сеть
              </a>
            </li>
            <li className="pt-3">
              <Link
                href="/partner/yookassa"
                className="group flex items-center gap-3 rounded-xl border border-white/15 bg-gradient-to-r from-yellow/20 via-red/20 to-mint/20 px-4 py-3 transition-transform hover:scale-[1.02]"
              >
                <span className="text-xl" aria-hidden="true">
                  💳
                </span>
                <span className="flex flex-col">
                  <span className="font-bold text-white">
                    ЮKassa для бизнеса
                  </span>
                  <span className="text-xs text-white/55">
                    Платежи без комиссии 90 дней
                  </span>
                </span>
                <span className="ml-auto text-white/40 transition-transform group-hover:translate-x-1">
                  →
                </span>
              </Link>
            </li>
          </ul>
          <div className="mt-6 font-display text-xs font-extrabold uppercase tracking-widest text-yellow">
            Мы в соцсетях
          </div>
          <ul className="mt-3 space-y-2.5 text-sm text-white/70">
            <li>
              <a
                href="https://t.me/smart_zakupka"
                target="_blank"
                rel="noopener nofollow"
                className="social-link hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
                </svg>
                Telegram — Умный Покупатель (@smart_zakupka)
              </a>
            </li>
            <li>
              <a
                href="https://vk.com/club240879299"
                target="_blank"
                rel="noopener nofollow"
                className="social-link hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M15.07 2H8.93C4.33 2 2 4.33 2 8.93v6.14C2 19.67 4.33 22 8.93 22h6.14c4.6 0 6.93-2.33 6.93-6.93V8.93C22 4.33 19.67 2 15.07 2Zm3.41 13.91h-1.57c-.59 0-.77-.47-1.83-1.53-.93-.9-1.34-1.02-1.57-1.02-.32 0-.41.09-.41.53v1.39c0 .38-.12.63-1.12.63-1.65 0-3.48-1-4.77-2.86-1.95-2.76-2.5-4.83-2.5-5.25 0-.23.09-.45.53-.45h1.57c.4 0 .55.18.7.6.77 2.24 2.06 4.2 2.6 4.2.2 0 .29-.09.29-.6V9.22c-.06-1.1-.64-1.19-.64-1.58 0-.19.16-.38.42-.38h2.46c.34 0 .46.18.46.59v3.19c0 .34.15.46.25.46.2 0 .37-.12.75-.5 1.18-1.33 2.02-3.32 2.02-3.32.11-.23.3-.44.7-.44h1.57c.47 0 .57.24.47.59-.19.89-2.07 3.53-2.07 3.53-.17.27-.24.39 0 .71.17.23.73.71 1.1 1.14 1.48 1.48 1.63 2.15 1.63 2.15.1.25-.13.51-.55.51Z" />
                </svg>
                ВКонтакте — ПромоФакт
              </a>
            </li>
            <li>
              <a
                href="https://dzen.ru/id/66d486816000f25d542e7180"
                target="_blank"
                rel="noopener nofollow"
                className="social-link hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm3.6 11.2-4.2 2.2c-.5.3-1.1-.1-.9-.6l.9-3-2.6-2c-.5-.4-.2-1.1.4-1.1h4.9c.5 0 .8.5.6 1l-1.2 2.8 2.7 1.9c.5.4.2 1.1-.6 1Z" />
                </svg>
                Дзен — Лапка-Экономка
              </a>
            </li>
            <li>
              <a
                href="https://www.youtube.com/@SmartShopping-o9k"
                target="_blank"
                rel="noopener nofollow"
                className="social-link hover:text-white transition-colors"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
                  <path d="M23 12s0-3.2-.4-4.7a2.5 2.5 0 0 0-1.8-1.8C19.2 5 12 5 12 5s-7.2 0-8.8.5A2.5 2.5 0 0 0 1.4 7.3C1 8.8 1 12 1 12s0 3.2.4 4.7a2.5 2.5 0 0 0 1.8 1.8C4.8 19 12 19 12 19s7.2 0 8.8-.5a2.5 2.5 0 0 0 1.8-1.8C23 15.2 23 12 23 12Zm-13 3V9l5 3-5 3Z" />
                </svg>
                YouTube — ПРОМО·ФАКТ
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <p className="text-xs leading-relaxed text-white/40 mb-3">
            {SITE_NAME} — это бесплатный информационный сервис-каталог, созданный для сравнения скидочных предложений. Сайт носит исключительно информационный характер, не является интернет-магазином и не продает товары или услуги напрямую. Мы не несем ответственности за точность информации, предоставленной партнерами, за условия акций, а также за любую другую информацию. Все торговые марки, логотипы и названия брендов, представленные на сайте, являются собственностью их соответствующих владельцев и взяты из открытых источников или предоставлены партнерскими программами (Perfluence, Saleads, Яндекс и др.).
          </p>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <p className="text-xs text-white/30">
              © {new Date().getFullYear()} {SITE_NAME}. Все права защищены.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
