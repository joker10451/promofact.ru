/**
 * Read-only daily catalog watch. No database writes, Git commits, affiliate
 * clicks, Vercel deployments or Perfluence publication actions.
 * GitHub Actions restores the last report state from the Actions cache.
 */
import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { getCustomCoupons } from "../src/lib/customCoupons.ts";
import { inspectCoupons, compareInventories, checkSourceCompleteness, reconcileCrossSourceChanges } from "./coupon-watch-core.mjs";

const OUTPUT = path.resolve("audit-results");
const STATE_PATH = path.join(OUTPUT, "coupon-watch-state.json");
const JSON_PATH = path.join(OUTPUT, "coupon-watch-report.json");
const MARKDOWN_PATH = path.join(OUTPUT, "coupon-watch-report.md");
const SITE_URL = "https://promofact.ru";
const maxLines = 30;
const now = Date.now();

fs.mkdirSync(OUTPUT, { recursive: true });
function readPrevious() {
  try {
    const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
    return state?.version === 1 && state.sources && typeof state.sources === "object"
      ? state : { version: 1, sources: {} };
  } catch {
    return { version: 1, sources: {} };
  }
}
const previous = readPrevious();
const state = { version: 1, generatedAt: new Date(now).toISOString(), sources: { ...previous.sources } };
const sourceReports = [];
const changes = [];
const findings = [];
const expiring = [];
const errors = [];
const healthySources = new Set();

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: "application/json", "Cache-Control": "no-cache" },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("HTTP " + response.status);
  const data = await response.json();
  if (!Array.isArray(data)) throw new Error("Неверный формат JSON: ожидался список");
  if (data.length === 0) throw new Error("Пустой ответ Perfluence, последний успешный снимок сохранён");
  return data;
}

async function getPublishedAdmitad() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  if (!url || !key) return { skipped: "Отсутствуют Supabase Secrets (только чтение)" };
  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const rows = [];
  for (let start = 0; start < 5000; start += 500) {
    const { data, error } = await supabase.from("admitad_coupons")
      .select("id,code,store,store_slug,bonus_name,terms,expires,affiliate_link,affiliate_url,ord_marker,ord_text,is_active")
      .eq("is_active", true)
      .order("id", { ascending: true })
      .range(start, start + 499);
    if (error) throw new Error("Supabase: " + error.code);
    rows.push(...(data || []));
    if ((data || []).length < 500) break;
  }
  if (rows.length === 0) throw new Error("Нулевой опубликованный каталог Admitad — источник нужно проверить");
  return rows.map((row) => ({
    id: row.id,
    store: { slug: row.store_slug || row.store || "unknown" },
    promocode: {
      id: row.id, code: row.code || "", bonusName: row.bonus_name || "",
      terms: row.terms || "", expires: row.expires || null, isBarcode: false,
    },
    affiliate: {
      link: row.affiliate_link || row.affiliate_url || "",
      ordMarker: row.ord_marker || "", ordText: row.ord_text || "",
    },
  }));
}

function getMessageLine(x) {
  const code = x.code ? " / " + x.code : "";
  return "- **" + x.source + " · " + x.slug + code + "** — " + x.detail;
}

async function inspectSource(name, producer) {
  try {
    const raw = await producer();
    if (raw?.skipped) {
      sourceReports.push({ source: name, status: "skipped", message: raw.skipped });
      return;
    }
    const result = inspectCoupons(raw, name, now);
    const prior = previous.sources[name];
    const completeness = checkSourceCompleteness(prior, result, name, now);
    if (!completeness.ok) {
      const anomaly = new Error(completeness.detail);
      anomaly.sourceAnomaly = true;
      throw anomaly;
    }
    if (prior?.records) changes.push(...compareInventories(prior, result, now));
    healthySources.add(name);
    findings.push(...result.findings);
    expiring.push(...result.expiring);
    state.sources[name] = { records: result.records, consecutiveFailures: 0 };
    sourceReports.push({
      source: name, status: "ok", active: result.activeCount, codes: result.codeCount,
      deals: result.noCodeCount, expired: result.expiredCount, issues: result.findings.length,
    });
  } catch (error) {
    const previousFailures = previous.sources[name]?.consecutiveFailures || 0;
    const consecutiveFailures = previousFailures + 1;
    // Preserve the previous successful snapshot, never turn a temporary API
    // outage into the misleading disappearance of every coupon.
    state.sources[name] = { ...(previous.sources[name] || {}), consecutiveFailures };
    const message = error instanceof Error ? error.message.slice(0, 220) : "Ошибка соединения";
    const anomaly = Boolean(error?.sourceAnomaly);
    sourceReports.push({ source: name, status: anomaly ? "anomaly" : "unavailable", consecutiveFailures, message });
    errors.push({ source: name, consecutiveFailures, message, anomaly });
  }
}

await inspectSource("manual", () => Promise.resolve(getCustomCoupons(now)));
// Audit the UNFILTERED feed; the public snapshot intentionally hides
// unverified affiliate offers, but the watcher must still report them.
await inspectSource("perfluence", () => fetchJson(SITE_URL + "/api/perfluence-audit"));
await inspectSource("admitad", getPublishedAdmitad);

const reconciledChanges = reconcileCrossSourceChanges(changes, state.sources, healthySources);
const critical = findings.filter((f) => f.severity === "critical");
const majorChanges = reconciledChanges.filter((c) => ["removed", "changed"].includes(c.type));
const newOffers = reconciledChanges.filter((c) => c.type === "new");
const outages = errors.filter((e) => e.consecutiveFailures >= 2 || e.anomaly);
const attention = [
  ...critical.map(getMessageLine),
  ...majorChanges.map(getMessageLine),
  ...newOffers.map(getMessageLine),
  ...outages.map((e) => "- **" + e.source + "** — " + (e.anomaly ? e.message : "источник недоступен " + e.consecutiveFailures + " запуска подряд")),
  ...expiring.filter((e) => e.remainingHours <= 24).map(
    (e) => "- **" + e.slug + " / " + e.code + "** — заканчивается в ближайшие 24 часа: " + e.expires),
].slice(0, 75);
const report = {
  generatedAt: state.generatedAt,
  sourceReports, criticalCount: critical.length, warningCount: findings.length - critical.length,
  changes: reconciledChanges, expiring, outages, findings, attention, requiresAttention: attention.length > 0,
};
const lines = [
  "# Ежедневный контроль промокодов — " + state.generatedAt,
  "",
  "Только чтение. Проверяются актуальные данные без перехода по рекламным ссылкам и без деплоев.",
  "",
  "| Источник | Статус | Активных | Кодовых | Без кода / штрихкод |",
  "|---|---|---:|---:|---:|",
  ...sourceReports.map((r) => "| " + r.source + " | " + r.status +
    (r.message ? " (" + r.message.replace(/\|/g, "/") + ")" : "") + " | " +
    (r.active ?? "—") + " | " + (r.codes ?? "—") + " | " + (r.deals ?? "—") + " |"),
  "",
  "Критичных нарушений: **" + critical.length + "**; предупреждений: **" +
    (findings.length - critical.length) + "**; изменений: **" + reconciledChanges.length +
    "**; акций ручного каталога с окончанием менее чем через 48 ч: **" + expiring.length + "**.",
  "",
  "## Требуют внимания",
  ...(!attention.length ? ["- Сейчас нет новых подтверждённых проблем."] : attention.slice(0, maxLines)),
  ...(attention.length > maxLines ? ["- И ещё " + (attention.length - maxLines) + " — в JSON-отчёте."] : []),
  "",
  "## Изменения относительно предыдущего успешного снимка",
  ...(!reconciledChanges.length ? ["- Нет изменений; или это первый запуск / источник пока недоступен."] :
    reconciledChanges.slice(0, maxLines).map((c) => "- " + c.type + " · " + c.source + " · " + c.slug +
      (c.code ? " / " + c.code : "") + ": " + c.detail)),
  "",
  "## Заканчиваются за 48 часов (ручные партнёрские размещения)",
  ...(!expiring.length ? ["- Нет."] :
    expiring.slice(0, maxLines).map((e) => "- " + e.slug + " / " + e.code +
      " — " + e.expires + " (≈" + e.remainingHours + " ч)")),
  "",
  "Важное ограничение: проверка дат, ссылок и ERID **не подтверждает** принятие кода магазином.",
  "При отсутствии одного источника предыдущая успешная выборка сохраняется. Если нет Supabase Secrets, Admitad честно отмечается как skipped.",
  "",
];
fs.writeFileSync(JSON_PATH, JSON.stringify(report, null, 2) + "\n");
fs.writeFileSync(MARKDOWN_PATH, lines.join("\n") + "\n");
fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
console.log(lines.join("\n"));
console.log("JSON report:", JSON_PATH);
if (critical.length || outages.length) process.exitCode = 1;
