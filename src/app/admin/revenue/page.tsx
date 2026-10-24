import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  hasStatsAccess, hasRevenueAccess, REVENUE_COOKIE,
} from "@/lib/revenueAccess";
import {
  loadRevenueReport,
  type RevenuePeriod,
  type RevenueSummary,
  type RevenueDay,
} from "@/lib/revenueDashboard";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;
export const metadata: Metadata = {
  title: "Доходы · приватная панель ПромоФакта",
  robots: { index: false, follow: false, nocache: true },
};

async function logout() {
  "use server";
  (await cookies()).set(REVENUE_COOKIE, "", {
    path: "/admin/revenue", httpOnly: true, secure: true, sameSite: "strict", maxAge: 0,
  });
  redirect("/admin/revenue/login");
}

function money(amount: number, currency: string): string {
  const value = new Intl.NumberFormat("ru-RU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return value + " " + (currency === "RUB" ? "₽" : currency);
}

function Stat({
  title, value, hint,
}: { title: string; value: string; hint?: string }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="text-xs font-medium text-ink/65">{title}</div>
      <div className="mt-2 break-words font-display text-2xl font-extrabold text-ink sm:text-3xl">{value}</div>
      {hint && <div className="mt-2 text-xs leading-relaxed text-ink/65">{hint}</div>}
    </div>
  );
}

function groupForChart(days: RevenueDay[], period: RevenuePeriod): RevenueDay[] {
  if (period !== 90) return days;
  // 90-day display: compact weekly totals instead of 90 unreadable bars.
  const result: RevenueDay[] = [];
  for (let i = 0; i < days.length; i += 7) {
    const block = days.slice(i, i + 7);
    result.push({
      date: block[0].date,
      approved: block.reduce((sum, day) => sum + day.approved, 0),
      pending: block.reduce((sum, day) => sum + day.pending, 0),
      actions: block.reduce((sum, day) => sum + day.actions, 0),
    });
  }
  return result;
}

function RevenueChart({
  days, period, currency,
}: { days: RevenueDay[]; period: RevenuePeriod; currency: string }) {
  const points = groupForChart(days, period);
  const maximum = Math.max(1, ...points.map(x => Math.max(0, x.approved, x.pending)));
  return (
    <section aria-label="График начислений по датам" className="rounded-2xl border border-line bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h3 className="font-display text-base font-bold text-ink">Динамика комиссий</h3>
        <div className="flex items-center gap-3 text-xs font-medium text-ink/75">
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />Подтверждено</span>
          <span><span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-amber-400" />Ожидает</span>
        </div>
      </div>
      <p className="mt-1 text-xs text-ink/65">
        {period === 90 ? "Суммы по семидневным периодам" : "Суммы по дням"}.
        График показывает дату действия по API Admitad, не дату выплаты.
      </p>
      <div className="mt-5 flex h-44 w-full items-end gap-1.5 border-b border-line pb-1 sm:gap-2">
        {points.map((point, index) => (
          <div key={point.date + index} className="group relative flex h-full min-w-0 flex-1 items-end justify-center gap-px">
            <div title={point.date + " · подтверждено " + money(point.approved, currency)}
              className="min-w-0 flex-1 rounded-t-sm bg-emerald-500"
              style={{ height: (Math.max(0, point.approved) / maximum * 100) + "%" }} />
            <div title={point.date + " · ожидает " + money(point.pending, currency)}
              className="min-w-0 flex-1 rounded-t-sm bg-amber-400"
              style={{ height: (Math.max(0, point.pending) / maximum * 100) + "%" }} />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-ink/60">
        <span>{points[0]?.date ?? "—"}</span>
        <span>{points[points.length - 1]?.date ?? "—"}</span>
      </div>
      <p className="mt-3 text-xs text-ink/65">
        Данные отображаются только для авторизованного владельца. Переводы между валютами не выполняются.
      </p>
    </section>
  );
}

function Totals({ summary }: { summary: RevenueSummary }) {
  const c = summary.currency;
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Stat title="Подтверждённая комиссия" value={money(summary.approved, c)}
        hint="Не равна выведенным средствам" />
      <Stat title="В обработке" value={money(summary.pending, c)}
        hint="Доход ещё не подтверждён" />
      <Stat title="Задержано к оплате" value={money(summary.stalled, c)}
        hint="Подтверждено, но ожидается оплата рекламодателем" />
      <Stat title="Отклонённые начисления" value={money(summary.declined, c)}
        hint="Не включать в ожидаемый доход" />
    </div>
  );
}

export default async function RevenueDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  // Authorize before reading request parameters or fetching ANY financial data.
  if (!(await hasStatsAccess())) redirect("/admin/login");
  if (!(await hasRevenueAccess())) redirect("/admin/revenue/login");
  const { days: rawDays } = await searchParams;
  const days: RevenuePeriod = rawDays === "7" ? 7 : rawDays === "90" ? 90 : 30;
  let report: Awaited<ReturnType<typeof loadRevenueReport>> | null = null;
  try {
    report = await loadRevenueReport(days);
  } catch {
    // Do not expose remote Admitad response details, OAuth errors or URLs.
    report = null;
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-ink/60">ПромоФакт · закрытый раздел</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-ink">Финансовая аналитика</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink/75">
            Данные действий Admitad для сайта. Подтверждённые начисления, ожидание,
            задержки и отказы показываются отдельно. Это не оборот и не баланс для вывода.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/admin" className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink">Админка</Link>
          <form action={logout}>
            <button className="rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-ink/30">
              Выйти из финансов
            </button>
          </form>
        </div>
      </header>

      <nav className="mt-6 flex flex-wrap gap-2" aria-label="Период отчёта">
        {([7, 30, 90] as const).map(period => (
          <Link
            key={period}
            href={"/admin/revenue?days=" + period}
            aria-current={days === period ? "page" : undefined}
            className={"rounded-xl px-4 py-2 text-sm font-semibold " +
              (days === period ? "bg-ink text-white" : "border border-line bg-white text-ink")}
          >
            {period} дней
          </Link>
        ))}
      </nav>

      {!report ? (
        <div role="alert" className="mt-7 rounded-2xl border border-red/30 bg-red/10 p-5 text-sm text-ink">
          Не удалось получить полный подтверждённый ответ Admitad.
          Финансовые суммы скрыты до устранения проблемы. Проверь серверные переменные
          ADMITAD_CLIENT_ID, ADMITAD_CLIENT_SECRET и ADMITAD_WEBSITE_ID и доступ к Statistics API.
        </div>
      ) : (
        <>
          <div className="mt-4 text-xs text-ink/65">
            Период: {report.start} — {report.end}. Срез сформирован {new Date(report.generatedAt).toLocaleString("ru-RU", { timeZone: "Europe/Moscow" })} МСК.
            Пересчёт производится при открытии страницы.
          </div>

          {report.currencies.length === 0 && (
            <div className="mt-6 rounded-2xl border border-line bg-white p-6 text-sm text-ink/75">
              Admitad не вернул действий за выбранный период. Это отсутствие записей, не ошибка и не доказательство нулевых показов.
            </div>
          )}

          {report.currencies.map(({ summary, days: timeline }) => (
            <section key={summary.currency} className="mt-7 space-y-4">
              <h2 className="font-display text-xl font-extrabold text-ink">Валюта: {summary.currency}</h2>
              <Totals summary={summary} />
              <div className="grid gap-3 sm:grid-cols-3">
                <Stat title="Зафиксированных действий" value={String(summary.actions)}
                  hint={"Продажи: " + summary.sales + " · лиды: " + summary.leads} />
                <Stat title="С маркером ПромоФакта" value={String(summary.tagged)}
                  hint="SubID3 или резервная метка SubID1; персональные коды могут менять SubID3" />
                <Stat title="Без маркера ПромоФакта" value={String(summary.unattributed)}
                  hint="Не приписываем эти действия конкретному переходу" />
              </div>
              <RevenueChart days={timeline} period={days} currency={summary.currency} />
              {summary.unknown !== 0 && (
                <p role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-ink">
                  Неизвестные статусы: {money(summary.unknown, summary.currency)}.
                  Они не включены в подтверждённую комиссию.
                </p>
              )}
            </section>
          ))}

          <section className="mt-8 rounded-2xl border border-line bg-white p-4 sm:p-6">
            <h2 className="font-display text-lg font-extrabold text-ink">Партнёрские программы Admitad</h2>
            <p className="mt-1 text-xs text-ink/65">
              Только агрегированные значения. Отчёт не содержит персональных данных покупателей, номеров заказов или промокодов.
            </p>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[700px] border-collapse text-left text-sm">
                <thead className="border-b border-line text-xs text-ink/75">
                  <tr>
                    <th scope="col" className="py-3 pr-3">Программа</th>
                    <th scope="col" className="px-2 py-3 text-right">Действий</th>
                    <th scope="col" className="px-2 py-3 text-right">Подтверждено</th>
                    <th scope="col" className="px-2 py-3 text-right">Ожидает</th>
                    <th scope="col" className="px-2 py-3 text-right">Задержано</th>
                    <th scope="col" className="px-2 py-3 text-right">Отклонено</th>
                  </tr>
                </thead>
                <tbody>
                  {report.campaigns.map(row => (
                    <tr key={row.currency + ":" + row.campaignId} className="border-b border-line/60">
                      <td className="max-w-xs break-words py-3 pr-3 font-semibold text-ink">
                        {row.name} <span className="block text-xs font-normal text-ink/60">ID {row.campaignId} · {row.currency}</span>
                      </td>
                      <td className="px-2 py-3 text-right tabular-nums">{row.summary.actions}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{money(row.summary.approved, row.currency)}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{money(row.summary.pending, row.currency)}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{money(row.summary.stalled, row.currency)}</td>
                      <td className="px-2 py-3 text-right tabular-nums">{money(row.summary.declined, row.currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <p className="mt-6 text-xs leading-relaxed text-ink/70">
            Perfluence не включён в финансовые итоги: статус одобрения начислений не подтверждён.
            Графики показывают действия по датам, которые предоставляет Admitad; комиссии могут менять статус.
            Данные разных валют не суммируются. Кликам Метрики не присваиваются вымышленные продажи.
          </p>
        </>
      )}
    </main>
  );
}
