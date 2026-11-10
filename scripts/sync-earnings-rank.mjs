#!/usr/bin/env node
/**
 * Builds src/data/earnings-rank.json from Perfluence results (PERFLUENCE_RESULTS_URL):
 * project ids and promo codes ordered by earnings over the last WINDOW_DAYS.
 *
 * The repository is public, so ONLY the order is stored — never fees, counts
 * or dates. The site uses it in byScore() to show the best earners first.
 * Missing secret or an unreachable API keeps the previous file untouched.
 */
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const WINDOW_DAYS = 30;
const OUT = path.resolve("src/data/earnings-rank.json");

function fee(v) {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const m = String(v ?? "").match(/\d+(?:[.,]\d+)?/);
  return m ? Number(m[0].replace(",", ".")) : 0;
}

/** Pure aggregation: payload → { projects, codes } ordered by earnings desc. */
export function rankEarnings(payload, nowMs = Date.now()) {
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  const since = nowMs - WINDOW_DAYS * 86400000;
  const byProject = new Map();
  const byCode = new Map();
  for (const row of rows) {
    // Perfluence reports Moscow time without an offset.
    const at = Date.parse(String(row?.datetime ?? "").replace(" ", "T") + "+03:00");
    const amount = fee(row?.fee);
    if (!Number.isFinite(at) || at < since || at > nowMs + 86400000 || !(amount > 0)) continue;
    const project = Number(row?.project?.id ?? row?.project?.project_id);
    if (Number.isSafeInteger(project) && project > 0)
      byProject.set(project, (byProject.get(project) ?? 0) + amount);
    const code = String(row?.promocode ?? "").trim().toUpperCase();
    if (code) byCode.set(code, (byCode.get(code) ?? 0) + amount);
  }
  const order = (m) => [...m.entries()].sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0]))).map(([k]) => k);
  return { projects: order(byProject), codes: order(byCode) };
}

async function main() {
  // The results feed is only a slice (~21 rows), so it would overwrite the dashboard-based order.
  if (!process.env.EARNINGS_RANK_FROM_FEED) {
    console.log("ℹ️ Рейтинг дохода задан по дашборду вручную; автообновление из ленты выключено");
    return;
  }
  const url = process.env.PERFLUENCE_RESULTS_URL;
  if (!url) {
    console.log("ℹ️ PERFLUENCE_RESULTS_URL не задан — рейтинг дохода не обновляется");
    return;
  }
  let payload;
  try {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error("HTTP " + res.status);
    payload = await res.json();
  } catch (e) {
    // Never print the URL: it embeds the account key.
    console.warn("⚠️ Perfluence results недоступны, рейтинг оставлен прежним:", e instanceof Error ? e.message.slice(0, 80) : "error");
    return;
  }
  const rank = rankEarnings(payload);
  const prev = fs.existsSync(OUT) ? JSON.parse(fs.readFileSync(OUT, "utf8")) : {};
  if (JSON.stringify(prev.projects) === JSON.stringify(rank.projects) &&
      JSON.stringify(prev.codes) === JSON.stringify(rank.codes)) {
    console.log("✓ Рейтинг дохода не изменился");
    return;
  }
  const tmp = OUT + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify({ windowDays: WINDOW_DAYS, ...rank }, null, 2) + "\n");
  fs.renameSync(tmp, OUT);
  console.log(`✓ Рейтинг дохода обновлён: проектов ${rank.projects.length}, кодов ${rank.codes.length}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) await main();
