"use client";

import { useEffect, useState } from "react";

type Row = Record<string, unknown> & { id: string; store: string; code: string; is_active?: boolean };

export default function AdminClient({ supabaseReady }: { supabaseReady: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // form
  const [form, setForm] = useState({
    id: "",
    store: "Кинопоиск",
    store_slug: "kinopoisk",
    code: "6ZJP6PZFQH",
    bonusName: "Скидка до 50% на Кинопоиск + 60 дней",
    category: "Онлайн-кинотеатры",
    expires: "2026-09-30",
    affiliateLink: "https://kp45.prfl.me/sites/b42qv0?erid=2Ranyk7g9Y7",
    ordMarker: "2Ranyk7g9Y7",
    ordText: "Реклама. ООО «ЯНДЕКС», ИНН 7736207543",
    logo: "https://www.google.com/s2/favicons?domain=kinopoisk.ru&sz=128",
    site: "https://www.kinopoisk.ru",
    isHit: true,
    isFirstOrderOnly: true,
  });

  const load = async () => {
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch("/api/admin/coupons", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      setRows((j.data as Row[]) ?? []);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (supabaseReady) load();
    else setLoading(false);
  }, [supabaseReady]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    try {
      const payload: Record<string, unknown> = {
        id: form.id || undefined,
        code: form.code,
        store: form.store,
        store_slug: form.store_slug,
        discount: form.bonusName,
        bonus_name: form.bonusName,
        category: form.category,
        description: form.bonusName,
        expires: form.expires || null,
        affiliate_url: form.affiliateLink,
        affiliate_link: form.affiliateLink,
        ord_marker: form.ordMarker,
        ord_text: form.ordText,
        logo: form.logo,
        site: form.site,
        is_hit: form.isHit,
        is_first_order_only: form.isFirstOrderOnly,
        is_active: true,
      };
      const r = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || r.statusText);
      setForm((f) => ({ ...f, id: "" }));
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const del = async (id: string) => {
    if (!confirm(`Удалить ${id}?`)) return;
    const r = await fetch(`/api/admin/coupons?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) alert(j.error || r.statusText);
    await load();
  };

  const edit = (row: Row) => {
    setForm({
      id: String(row.id),
      store: String(row.store ?? ""),
      store_slug: String((row.store_slug as string) ?? ""),
      code: String(row.code ?? ""),
      bonusName: String((row.bonus_name as string) ?? (row.discount as string) ?? ""),
      category: String(row.category ?? ""),
      expires: String((row.expires as string) ?? "").slice(0, 10),
      affiliateLink: String((row.affiliate_link as string) ?? (row.affiliate_url as string) ?? ""),
      ordMarker: String((row.ord_marker as string) ?? ""),
      ordText: String((row.ord_text as string) ?? ""),
      logo: String((row.logo as string) ?? ""),
      site: String((row.site as string) ?? ""),
      isHit: Boolean(row.is_hit),
      isFirstOrderOnly: Boolean(row.is_first_order_only),
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mt-8">
      {err && <div className="mb-4 rounded-xl border border-red/30 bg-red/10 px-4 py-3 text-sm font-bold text-red-700">{err}</div>}

      <section className="rounded-2xl border border-line bg-white p-6 shadow-[0_6px_0_rgba(11,16,43,0.08)]">
        <h2 className="font-display text-lg font-extrabold">Добавить / обновить купон</h2>
        <p className="mt-1 text-xs text-ink/50">Поля с * — обязательны. Код может быть пустым для «скидка по ссылке». Срок — YYYY-MM-DD.</p>
        <form onSubmit={submit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            Магазин *<input value={form.store} onChange={(e) => setForm({ ...form, store: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" required />
          </label>
          <label className="text-xs font-bold">
            Slug (латиница) <input value={form.store_slug} onChange={(e) => setForm({ ...form, store_slug: e.target.value })} placeholder="kinopoisk" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-bold">
            Промокод <input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="6ZJP6PZFQH" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-mono" />
          </label>
          <label className="text-xs font-bold">
            Категория <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="sm:col-span-2 text-xs font-bold">
            Заголовок скидки *<input value={form.bonusName} onChange={(e) => setForm({ ...form, bonusName: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" required />
          </label>
          <label className="text-xs font-bold">
            Срок (expires) <input type="date" value={form.expires} onChange={(e) => setForm({ ...form, expires: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="text-xs font-bold">
            Ссылка prfl.me *<input value={form.affiliateLink} onChange={(e) => setForm({ ...form, affiliateLink: e.target.value })} placeholder="https://kp45.prfl.me/sites/..." className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" required />
          </label>
          <label className="text-xs font-bold">
            erid (ord_marker) <input value={form.ordMarker} onChange={(e) => setForm({ ...form, ordMarker: e.target.value })} placeholder="2Ranyk7g9Y7" className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm font-mono" />
          </label>
          <label className="text-xs font-bold">
            Текст рекламы <input value={form.ordText} onChange={(e) => setForm({ ...form, ordText: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="sm:col-span-2 text-xs font-bold">
            Лого (URL) <input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} className="mt-1 w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm" />
          </label>
          <label className="sm:col-span-2 flex items-center gap-2 text-xs font-bold">
            <input type="checkbox" checked={form.isHit} onChange={(e) => setForm({ ...form, isHit: e.target.checked })} /> 🔥 хит
            <input type="checkbox" checked={form.isFirstOrderOnly} onChange={(e) => setForm({ ...form, isFirstOrderOnly: e.target.checked })} className="ml-4" /> первый заказ
          </label>
          <div className="sm:col-span-2 flex gap-2">
            <button disabled={saving} type="submit" className="rounded-xl bg-yellow px-5 py-2.5 text-sm font-extrabold shadow-offset disabled:opacity-60">
              {saving ? "Сохранение…" : form.id ? "Обновить" : "Добавить купон"}
            </button>
            {form.id && (
              <button type="button" onClick={() => setForm((f) => ({ ...f, id: "" }))} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-bold">
                Сбросить
              </button>
            )}
            <span className="ml-auto text-xs text-ink/40 self-center">ID: {form.id || "авто"}</span>
          </div>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-extrabold">Купонная база Supabase ({rows.length})</h2>
          <button onClick={load} className="rounded-xl border border-line px-3 py-1.5 text-xs font-bold hover:border-ink">Обновить</button>
        </div>
        {loading ? (
          <p className="mt-4 text-sm text-ink/50">Загрузка…</p>
        ) : !supabaseReady ? (
          <p className="mt-4 text-sm text-ink/50">Supabase не подключен — покажи настройку выше. Таблица пока пуста.</p>
        ) : rows.length === 0 ? (
          <p className="mt-4 text-sm text-ink/50">
            Пока пусто. Добавь первый купон формой выше — он появится на сайте через ~10 мин (ISR). Пример уже подставлен (Кинопоиск 6ZJP6PZFQH).
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-line text-[11px] uppercase tracking-widest text-ink/45">
                  <th className="px-3 py-2">Магазин</th>
                  <th className="px-3 py-2">Код</th>
                  <th className="px-3 py-2">Скидка</th>
                  <th className="px-3 py-2">Срок</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={String(r.id)} className="border-b border-line/60 last:border-0">
                    <td className="px-3 py-2 font-bold">{String(r.store)}</td>
                    <td className="px-3 py-2 font-mono">{String(r.code || "—")}</td>
                    <td className="px-3 py-2 max-w-[220px] truncate">{String((r.bonus_name as string) ?? (r.discount as string) ?? "")}</td>
                    <td className="px-3 py-2">{String((r.expires as string) ?? "").slice(0, 10) || "—"}</td>
                    <td className="px-3 py-2 flex gap-1">
                      <button onClick={() => edit(r)} className="rounded-lg border border-line bg-paper px-2 py-1 text-xs font-bold hover:border-ink">Правка</button>
                      <button onClick={() => del(String(r.id))} className="rounded-lg bg-red/10 px-2 py-1 text-xs font-bold text-red-700 hover:bg-red/20">Удалить</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-line bg-paper p-5 text-xs leading-relaxed text-ink/60">
        <p className="font-bold text-ink">Как работает автозалив</p>
        <ul className="mt-2 list-disc pl-5">
          <li>Perfluence/Saleads/Admitad — тянутся автоматом каждые 10 мин (переменные окружения).</li>
          <li>Твои эксклюзивы (erid) — добавляешь здесь → пишутся в Supabase → через 10 мин на всех страницах + sitemap.</li>
          <li>Старые `CUSTOM_COUPONS` из кода остаются как fallback, но новые лить только сюда (без деплоя).</li>
          <li>Дубль по коду: если в Supabase есть код `6ZJP6PZFQH`, Perfluence-дубль с тем же кодом глушится автоматом.</li>
        </ul>
      </section>
    </div>
  );
}
