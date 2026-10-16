import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  hasStatsAccess, revenueAccessConfigured, revenuePasswordMatches,
  createRevenueSession, REVENUE_COOKIE, REVENUE_SESSION_AGE_SECONDS,
  hasRevenueAccess,
} from "@/lib/revenueAccess";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const metadata: Metadata = {
  title: "Защищённый доступ к доходам",
  robots: { index: false, follow: false, nocache: true },
};

async function login(formData: FormData) {
  "use server";
  if (!(await hasStatsAccess())) redirect("/admin/login");
  const password = formData.get("password");
  if (!revenueAccessConfigured() || typeof password !== "string" ||
      !revenuePasswordMatches(password)) {
    redirect("/admin/revenue/login?error=1");
  }
  (await cookies()).set(REVENUE_COOKIE, createRevenueSession(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: REVENUE_SESSION_AGE_SECONDS,
    path: "/admin/revenue",
  });
  redirect("/admin/revenue");
}

export default async function RevenueLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  if (!(await hasStatsAccess())) redirect("/admin/login");
  if (await hasRevenueAccess()) redirect("/admin/revenue");
  const configured = revenueAccessConfigured();
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <div className="rounded-2xl border border-line bg-white p-6 shadow-sm sm:p-8">
        <p className="text-xs font-bold uppercase tracking-widest text-ink/60">ПромоФакт · только владелец</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-ink">Финансовая панель</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink/70">
          Дополнительный пароль защищает данные о партнёрских комиссиях.
          Сессия действует 12 часов; данные из Admitad не записываются в браузерное хранилище.
        </p>
        {!configured ? (
          <div role="alert" className="mt-5 rounded-xl border border-line bg-paper p-4 text-sm text-ink/80">
            Финансовый доступ ещё не настроен. Администратору нужно задать
            REVENUE_DASHBOARD_PASSWORD и REVENUE_SESSION_SECRET в защищённых
            переменных окружения Vercel. До настройки доступ закрыт.
          </div>
        ) : (
          <form action={login} className="mt-6 space-y-4">
            <label htmlFor="revenue-password" className="block text-sm font-semibold text-ink">
              Пароль финансовой панели
            </label>
            <input
              id="revenue-password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              maxLength={512}
              className="w-full rounded-xl border border-line bg-paper px-4 py-3 text-sm text-ink outline-none focus:border-ink/40"
            />
            {error && <p role="alert" className="text-sm font-semibold text-red-700">Не удалось войти. Проверь пароль.</p>}
            <button type="submit" className="w-full rounded-xl bg-ink px-4 py-3 font-semibold text-white hover:opacity-90">
              Открыть отчёт
            </button>
          </form>
        )}
        <Link href="/admin" className="mt-6 inline-block text-sm font-semibold text-ink/70 underline-offset-4 hover:underline">
          ← В админку
        </Link>
      </div>
    </main>
  );
}
