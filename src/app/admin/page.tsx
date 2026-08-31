import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { STATS_COOKIE, statsCookieValue } from "@/lib/statsAuth";
import { supabaseConfigured } from "@/lib/supabase";
import { SITE_NAME } from "@/lib/site";
import AdminClient from "./AdminClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `Админ — ${SITE_NAME}`,
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(STATS_COOKIE)?.value;
  const expected = await statsCookieValue();
  if (!expected || token !== expected) redirect("/admin/login");

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ink/45">ПромоФакт — приват</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold">Админ — купоны</h1>
          <p className="mt-2 max-w-2xl text-sm text-ink/50">
            Автозалив без деплоя. Perfluence/Saleads/Admitad льются сами (ISR 10 мин). Здесь — твои эксклюзивы с erid (Кинопоиск и т.д.).
            После сохранения купон появится на сайте за ~10 мин (или сразу после ручного ревалида).
          </p>
        </div>
        <div className="flex gap-2">
          <a href="/stats" className="rounded-xl border border-line bg-white px-4 py-2 text-sm font-bold hover:border-ink">
            Статистика
          </a>
          <a href="/" className="rounded-xl bg-yellow px-4 py-2 text-sm font-bold shadow-offset hover:translate-y-[2px] hover:shadow-none transition">
            На сайт →
          </a>
        </div>
      </header>

      {!supabaseConfigured && (
        <div className="mt-6 rounded-2xl border border-red/30 bg-red/10 p-5">
          <p className="font-bold text-red-700">Supabase не настроен</p>
          <p className="mt-1 text-sm text-ink/70">
            Добавь в Vercel Env: <code className="rounded bg-white px-1 py-0.5">NEXT_PUBLIC_SUPABASE_URL</code>,{" "}
            <code className="rounded bg-white px-1 py-0.5">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> и{" "}
            <code className="rounded bg-white px-1 py-0.5">SUPABASE_SERVICE_ROLE_KEY</code> (опц.).
            Затем в Supabase SQL Editor прогони <code>supabase/migrations/0001_init.sql</code> +{" "}
            <code>0002_coupons_v2.sql</code>. Пока ключей нет — сайт работает на <code>CUSTOM_COUPONS</code> из кода (как раньше).
          </p>
        </div>
      )}

      <AdminClient supabaseReady={supabaseConfigured} />
    </main>
  );
}
