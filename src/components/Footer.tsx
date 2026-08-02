import Link from "next/link";
import { categories, categorySlugs, getStores } from "@/lib/data";
import { SITE_NAME } from "@/lib/site";

export default function Footer() {
  const stores = getStores().slice(0, 12);

  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <div className="font-display text-xl font-extrabold">
            ПРОМО<span className="text-red">·</span>ДРОМ
          </div>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/55">
            Проверенные промокоды и купоны на скидку от 900+ магазинов.
            Обновляем каждый день, проверяем каждый код.
          </p>
        </div>

        <nav aria-label="Категории">
          <div className="font-display text-xs font-extrabold uppercase tracking-widest text-yellow">
            Категории
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {categorySlugs.map((slug) => (
              <li key={slug}>
                <Link href={`/category/${slug}`} className="hover:text-white transition-colors">
                  {categories[slug]}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Магазины">
          <div className="font-display text-xs font-extrabold uppercase tracking-widest text-yellow">
            Магазины
          </div>
          <ul className="mt-4 space-y-2.5 text-sm text-white/70">
            {stores.map((store) => (
              <li key={store.slug}>
                <Link href={`/store/${store.slug}`} className="hover:text-white transition-colors">
                  {store.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

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
            <li>
              <Link href="#partners" className="hover:text-white transition-colors">
                Рекламодателям
              </Link>
            </li>
            <li>
              <Link href="#partners" className="hover:text-white transition-colors">
                Блогерам
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
          <p className="text-xs leading-relaxed text-white/40">
            Переходы по ссылкам на сайтах магазинов — по партнёрским CPA-ссылкам
            Perfluence: {SITE_NAME} может получать комиссию за заказы, совершённые
            после перехода. Это не влияет на размер твоей скидки. Информация о
            промокодах носит справочный характер и может меняться в зависимости от
            условий магазинов.
          </p>
          <p className="mt-3 text-xs text-white/30">
            © {new Date().getFullYear()} {SITE_NAME}. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
}
