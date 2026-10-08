import { NextRequest, NextResponse } from "next/server";
import { isBearerAuthorized } from "@/lib/apiAuth";
import { runAdmitadSafeSync } from "@/lib/admitadSyncWorker";
import { getAdmitadSyncMeta } from "@/lib/admitadSupabase";

export const dynamic = "force-dynamic";

/**
 * Административный эндпоинт безопасной синхронизации Admitad (ADMITAD-2 Safe Autopilot).
 *
 * Безопасность:
 * - Требуется Bearer <CRON_SECRET> или <TELEGRAM_POSTING_SECRET>;
 * - Никаких паролей, токенов и секретов в ответе;
 * - Возвращает только агрегированные метрики и статус Health.
 */
export async function GET(req: NextRequest) {
  const isAuthorized = isBearerAuthorized(req.headers.get("authorization"), [
    process.env.CRON_SECRET,
    process.env.TELEGRAM_POSTING_SECRET,
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const meta = await getAdmitadSyncMeta();
  return NextResponse.json({
    ok: true,
    meta,
  });
}

export async function POST(req: NextRequest) {
  const isAuthorized = isBearerAuthorized(req.headers.get("authorization"), [
    process.env.CRON_SECRET,
    process.env.TELEGRAM_POSTING_SECRET,
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runAdmitadSafeSync();
    return NextResponse.json({
      ok: result.success,
      status: result.status,
      aggregates: result.aggregates,
      error: result.error,
    }, { status: result.success ? 200 : (result.status === "DEGRADED" ? 200 : 500) });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      error: (error as Error).message,
    }, { status: 500 });
  }
}
