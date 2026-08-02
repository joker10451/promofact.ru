import Link from "next/link";
import { getCategories, getStores } from "@/lib/perfluence";
import { SITE_NAME } from "@/lib/site";

export default async function Footer() {
  const categories = await getCategories();
  const stores = (await getStores()).slice(0, 12);

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="font-display text-xl font-extrabold">
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
          </nav>
        )}

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
          </ul>
          <div className="mt-6 font-display text-xs font-extrabold uppercase tracking-widest text-yellow">
            Мы в Telegram
          </div>
          <a
            href="https://t.me/smart_zakupka"
            target="_blank"
            rel="noopener nofollow"
            className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-white/70 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M21.94 4.4a1.5 1.5 0 0 0-2.05-.93L3.4 10.6c-.9.36-.85 1.67.07 1.96l4.14 1.3 1.72 5.29c.34 1.05 1.68 1.25 2.34.35l2.06-2.82a.5.5 0 0 1 .6-.13l4.66 2.16c.86.4 1.87-.2 1.88-1.1l.55-14.08a1 1 0 0 0-.44-.8Z" />
            </svg>
            @smart_zakupka
          </a>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <p className="text-xs leading-relaxed text-white/40">
            Переходы по ссылкам на сайтах магазинов — по партнёрским CPA-ссылкам
            Perfluence: {SITE_NAME} может получать комиссию за заказы,
            совершённые после перехода. Это не влияет на размер твоей скидки.
            Информация о промокодах носит справочный характер и может меняться в
            зависимости от условий магазинов.
          </p>
          <p className="mt-3 text-xs text-white/30">
            © {new Date().getFullYear()} {SITE_NAME}. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
