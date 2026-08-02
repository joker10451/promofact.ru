import type { Metadata } from "next";
import { fetchResults, type Result } from "@/lib/perfluence";
import { SITE_NAME } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Статистика — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

const rouble = (n: number) =>
  new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: n % 1 === 0 ? 0 : 1,
  }).format(n);

const ts = (r: Result) => new Date(r.datetime.replace(" ", "T")).getTime();

function kpis(results: Result[]) {
  const totalFee = results.reduce((s, r) => s + r.fee, 0);
  const orders = results.reduce((s, r) => s + r.stackedCount, 0);
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const fee30 = results.filter((r) => ts(r) >= cutoff).reduce((s, r) => s + r.fee, 0);
  return { totalFee, fee30, orders, avgFee: orders ? totalFee / orders : 0 };
}

function byStore(results: Result[]) {
  const map = new Map<
    number,
    { name: string; logo: string | null; orders: number; fee: number }
  >();
  for (const r of results) {
    const cur = map.get(r.project.id) ?? {
      name: r.project.name,
      logo: r.project.logo,
      orders: 0,
      fee: 0,
    };
    cur.orders += r.stackedCount;
    cur.fee += r.fee;
    map.set(r.project.id, cur);
  }
  return [...map.values()].sort((a, b) => b.fee - a.fee);
}

function byPromocode(results: Result[]) {
  const map = new Map<string, { orders: number; fee: number }>();
  for (const r of results) {
    const cur = map.get(r.promocode) ?? { orders: 0, fee: 0 };
    cur.orders += r.stackedCount;
    cur.fee += r.fee;
    map.set(r.promocode, cur);
  }
  return [...map.entries()].sort((a, b) => b[1].fee - a[1].fee);
}

function byDay(results: Result[]) {
  const map = new Map<string, number>();
  for (const r of results) map.set(r.datetime.slice(0, 10), (map.get(r.datetime.slice(0, 10)) ?? 0) + r.fee);
  const days: { label: string; fee: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push({ label: key, fee: map.get(key) ?? 0 });
  }
  return days;
}

export default async function StatsPage() {
  const results = await fetchResults();
  const kpi = kpis(results);
  const stores = byStore(results);
  const promos = byPromocode(results);
  const days = byDay(results);
  const maxDay = Math.max(...days.map((d) => d.fee), 1);
  const top3 = stores.slice(0, 3);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-widest text-ink/45">
          Приватный дашборд
        </p>
        <h1 className="mt-1 font-display text-3xl font-extrabold">Статистика партнёрок</h1>
        <p className="mt-2 text-sm text-ink/50">
          Комиссии по заказам через промокоды. Обновляется раз в 5 минут.
        </p>
      </header>

      <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Комиссия всего", value: rouble(kpi.totalFee) },
          { label: "За 30 дней", value: rouble(kpi.fee30) },
          { label: "Заказов всего", value: String(kpi.orders) },
          { label: "Средний чек комиссии", value: rouble(kpi.avgFee) },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-line bg-white p-5 shadow-[0_6px_0_rgba(11,16,43,0.08)]"
          >
            <div className="text-[11px] font-bold uppercase tracking-widest text-ink/45">
              {c.label}
            </div>
            <div className="mt-2 font-display text-2xl font-extrabold">{c.value}</div>
          </div>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-extrabold">Комиссия по дням · 30 дней</h2>
        <div className="mt-4 flex h-40 items-end gap-1 rounded-2xl border border-line bg-white p-4">
          {days.map((d) => (
            <div
              key={d.label}
              className="flex-1 rounded-t bg-yellow transition-colors hover:bg-yellow-dark"
              style={{ height: `${Math.max((d.fee / maxDay) * 100, 2)}%` }}
              title={`${d.label}: ${rouble(d.fee)}`}
            />
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-extrabold">По магазинам</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-widest text-ink/45">
                <th className="px-5 py-3 font-bold">Магазин</th>
                <th className="px-5 py-3 font-bold">Заказы</th>
                <th className="px-5 py-3 font-bold">Комиссия</th>
              </tr>
            </thead>
            <tbody>
              {stores.map((s) => (
                <tr key={s.name} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      {s.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={s.logo}
                          alt={s.name}
                          width={32}
                          height={32}
                          className="h-8 w-8 shrink-0 rounded-lg border border-line bg-paper object-contain"
                        />
                      ) : (
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-yellow font-display text-sm font-extrabold">
                          {s.name.slice(0, 1)}
                        </span>
                      )}
                      <span className="font-bold">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">{s.orders}</td>
                  <td className="px-5 py-3 font-bold text-mint">{rouble(s.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="font-display text-xl font-extrabold">Топ промокодов</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-widest text-ink/45">
                <th className="px-5 py-3 font-bold">Промокод</th>
                <th className="px-5 py-3 font-bold">Заказы</th>
                <th className="px-5 py-3 font-bold">Комиссия</th>
              </tr>
            </thead>
            <tbody>
              {promos.map(([code, v]) => (
                <tr key={code} className="border-b border-line/60 last:border-0">
                  <td className="px-5 py-3 font-display font-bold tracking-widest">{code}</td>
                  <td className="px-5 py-3">{v.orders}</td>
                  <td className="px-5 py-3 font-bold text-mint">{rouble(v.fee)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-10 rounded-2xl border border-line bg-white p-6">
        <h2 className="font-display text-lg font-extrabold">Что продвигать дальше</h2>
        {top3.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50">Пока нет данных по заказам.</p>
        ) : (
          <>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Топ-3 магазина по выручке:{" "}
              {top3.map((s, i) => `${i + 1}. ${s.name} (${rouble(s.fee)})`).join(", ")}.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink/70">
              Рекомендация: сделайте упор на SEO-страницы этих магазинов —{" "}
              {top3.map((s) => s.name).join(", ")} — и разместите их купоны выше на главной.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
