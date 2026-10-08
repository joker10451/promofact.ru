import { NextRequest, NextResponse } from "next/server";
import { isBearerAuthorized } from "@/lib/apiAuth";
import { getAdmitadConfig } from "@/lib/admitadApi";
import { getAdmitadSyncMeta, getActiveSnapshotCount } from "@/lib/admitadSupabase";

export const dynamic = "force-dynamic";

/**
 * Healthcheck фидов каталога PromoFact (ADMITAD-2 Observability).
 *
 * Не возвращает никаких секретов или конфиденциальных токенов.
 */
export async function GET(req: NextRequest) {
  const isAuthorized = isBearerAuthorized(req.headers.get("authorization"), [
    process.env.CRON_SECRET,
    process.env.TELEGRAM_POSTING_SECRET,
  ]);

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admitadConfig = getAdmitadConfig();
  const admitadConfigured = Boolean(admitadConfig);

  const meta = await getAdmitadSyncMeta();
  const snapshotCount = await getActiveSnapshotCount();

  let ageHours: number | null = null;
  let status: "OK" | "WARN" | "DEGRADED" | "UNKNOWN" = "UNKNOWN";

  if (meta?.last_success_at) {
    const lastSuccessMs = new Date(meta.last_success_at).getTime();
    ageHours = Math.round(((Date.now() - lastSuccessMs) / (1000 * 60 * 60)) * 10) / 10;
    if (ageHours > 24 || meta.last_status === "DEGRADED") {
      status = "DEGRADED";
    } else if (ageHours > 12) {
      status = "WARN";
    } else {
      status = "OK";
    }
  } else if (!admitadConfigured) {
    status = "WARN";
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    admitad: {
      configured: admitadConfigured,
      last_success: meta?.last_success_at || null,
      last_status: meta?.last_status || "UNKNOWN",
      snapshot_count: snapshotCount,
      publishable_count: meta?.last_success_count || 0,
      age_hours: ageHours,
      status,
    },
  });
}
