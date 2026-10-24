import "server-only";

import { getAdmitadAccessToken } from "@/lib/admitadApi";

export type RevenuePeriod = 7 | 30 | 90;
export type RevenueBucket = "approved" | "pending" | "stalled" | "declined" | "unknown";
export type RevenueSummary = {
  currency: string;
  actions: number;
  tagged: number;
  unattributed: number;
  sales: number;
  leads: number;
  approved: number;
  pending: number;
  stalled: number;
  declined: number;
  unknown: number;
  paidApproved: number;
};
export type RevenueDay = { date: string; approved: number; pending: number; actions: number };
export type RevenueCampaign = {
  campaignId: string;
  name: string;
  currency: string;
  summary: RevenueSummary;
};
export type RevenueReport = {
  start: string;
  end: string;
  period: RevenuePeriod;
  generatedAt: string;
  currencies: Array<{ summary: RevenueSummary; days: RevenueDay[] }>;
  campaigns: RevenueCampaign[];
  attributionNote: string;
};

type Action = {
  action_id?: unknown;
  advcampaign_id?: unknown;
  advcampaign_name?: unknown;
  action_date?: unknown;
  status?: unknown;
  payment?: unknown;
  currency?: unknown;
  action_type?: unknown;
  subid1?: unknown;
  subid3?: unknown;
  paid?: unknown;
};
type Page = { results?: unknown; _meta?: { count?: unknown } };

const MAX_ACTIONS = 5000;
const PAGE_SIZE = 100;

function fail(): never {
  // Never disclose API responses or request credentials to an authenticated browser.
  throw new Error("REVENUE_REPORT_UNAVAILABLE");
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}
function periodRange(period: RevenuePeriod, today = new Date()): { start: string; end: string; dates: string[] } {
  const anchor = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  const dates: string[] = [];
  for (let day = period - 1; day >= 0; day--) {
    dates.push(isoDate(new Date(anchor - day * 86400000)));
  }
  return { start: dates[0], end: dates[dates.length - 1], dates };
}
function apiDate(value: string): string {
  return value.slice(8, 10) + "." + value.slice(5, 7) + "." + value.slice(0, 4);
}
function moneyCents(value: unknown): number {
  if (typeof value !== "string" && typeof value !== "number") return fail();
  const raw = String(value);
  if (!/^-?[0-9]+(?:\.[0-9]{1,6})?$/.test(raw)) return fail();
  const n = Math.round(Number(raw) * 100);
  if (!Number.isSafeInteger(n) || Math.abs(n) > 1e12) return fail();
  return n;
}
function validId(value: unknown, digits: number): string {
  const raw = String(value ?? "");
  if (!new RegExp("^[0-9]{1," + digits + "}$").test(raw)) return fail();
  return raw;
}
function validDate(value: unknown): string {
  // Admitad actions use "YYYY-MM-DD HH:MM:SS"; preserve the reported date
  // instead of guessing a timezone and moving commissions to another day.
  const date = String(value ?? "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      Number.isNaN(Date.parse(date + "T00:00:00Z")) ||
      isoDate(new Date(date + "T00:00:00Z")) !== date) return fail();
  return date;
}
function status(value: unknown): RevenueBucket {
  switch (value) {
    case "approved": return "approved";
    case "pending": return "pending";
    case "approved_but_stalled": return "stalled";
    case "declined": return "declined";
    default: return "unknown";
  }
}
function empty(currency: string): RevenueSummary {
  return {
    currency, actions: 0, tagged: 0, unattributed: 0,
    sales: 0, leads: 0, approved: 0, pending: 0,
    stalled: 0, declined: 0, unknown: 0, paidApproved: 0,
  };
}
function add(summary: RevenueSummary, a: {
  status: RevenueBucket; cents: number; kind: string;
  tagged: boolean; paid: boolean;
}) {
  summary.actions++;
  if (a.tagged) summary.tagged++;
  else summary.unattributed++;
  if (a.kind === "sale") summary.sales++;
  else if (a.kind === "lead") summary.leads++;
  summary[a.status] += a.cents / 100;
  if (a.paid && a.status === "approved") summary.paidApproved += a.cents / 100;
}

/**
 * Aggregate only sanitized values. We never return action IDs, subids, raw
 * orders, referrers, promocodes, IPs or customer-specific fields to the UI.
 */
export function summarizeRevenueActions(
  actions: Action[], period: RevenuePeriod, now = new Date(),
): RevenueReport {
  const { start, end, dates } = periodRange(period, now);
  const currencies = new Map<string, RevenueSummary>();
  const campaigns = new Map<string, RevenueCampaign>();
  const perDate = new Map<string, Map<string, RevenueDay>>();
  const seen = new Set<string>();

  for (const action of actions) {
    if (!action || typeof action !== "object") return fail();
    const id = validId(action.action_id, 18);
    if (seen.has(id)) return fail(); // paging inconsistencies should never inflate commission
    seen.add(id);
    const campaignId = validId(action.advcampaign_id, 12);
    const currency = String(action.currency ?? "").toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) return fail();
    const date = validDate(action.action_date);
    if (date < start || date > end) return fail();
    const state = status(action.status);
    const cents = moneyCents(action.payment);
    const kind = String(action.action_type ?? "other");
    // Personal-code attribution can replace SubID3 inside Admitad.
    // New links carry an independent publisher marker in SubID1.
    const tagged = action.subid3 === "promofact" ||
      (typeof action.subid1 === "string" &&
        /^promofact:(?:[a-z0-9_-]{1,40})$/.test(action.subid1));
    const paid = action.paid === 1 || action.paid === "1" || action.paid === true;
    const clean = { status: state, cents, kind, tagged, paid };

    if (!currencies.has(currency)) currencies.set(currency, empty(currency));
    add(currencies.get(currency)!, clean);

    const key = currency + ":" + campaignId;
    if (!campaigns.has(key)) {
      const incomingName = typeof action.advcampaign_name === "string"
        ? action.advcampaign_name.slice(0, 100).trim() : "";
      campaigns.set(key, {
        campaignId,
        name: incomingName || "Программа " + campaignId,
        currency,
        summary: empty(currency),
      });
    }
    add(campaigns.get(key)!.summary, clean);

    if (!perDate.has(currency)) perDate.set(currency, new Map());
    const daily = perDate.get(currency)!;
    if (!daily.has(date)) daily.set(date, { date, approved: 0, pending: 0, actions: 0 });
    const point = daily.get(date)!;
    point.actions++;
    if (state === "approved") point.approved += cents / 100;
    if (state === "pending") point.pending += cents / 100;
  }
  return {
    period,
    start,
    end,
    generatedAt: now.toISOString(),
    currencies: [...currencies.values()].sort((a,b) => a.currency.localeCompare(b.currency))
      .map(summary => ({
        summary,
        days: dates.map(date => perDate.get(summary.currency)?.get(date) ??
          { date, approved: 0, pending: 0, actions: 0 }),
      })),
    campaigns: [...campaigns.values()].sort((a,b) =>
      b.summary.approved - a.summary.approved || a.name.localeCompare(b.name)),
    attributionNote: "tagged = SubID3 «promofact» или SubID1 «promofact:<тип страницы>». Admitad может заменять SubID3 для персональных кодов. Без метки = источник не подтверждён, а не доказательство чужого перехода.",
  };
}

async function fetchActions(start: string, end: string): Promise<Action[]> {
  const clientId = process.env.ADMITAD_CLIENT_ID ?? "";
  const clientSecret = process.env.ADMITAD_CLIENT_SECRET ?? "";
  const website = process.env.ADMITAD_WEBSITE_ID ?? "";
  if (!clientId || !clientSecret || !/^[0-9]{1,12}$/.test(website)) return fail();

  const auth = await getAdmitadAccessToken(clientId, clientSecret, { scopes: "statistics" });
  if (!auth.accessToken || !String(auth.scope ?? "").split(/[\s,]+/).includes("statistics")) return fail();

  const all: Action[] = [];
  let total: number | null = null;
  for (let offset = 0; offset < MAX_ACTIONS; offset += PAGE_SIZE) {
    const url = new URL("https://api.admitad.com/statistics/actions/");
    url.searchParams.set("website", website);
    url.searchParams.set("date_start", apiDate(start));
    url.searchParams.set("date_end", apiDate(end));
    url.searchParams.set("total", "0");
    url.searchParams.set("limit", String(PAGE_SIZE));
    url.searchParams.set("offset", String(offset));
    const res = await fetch(url, {
      headers: { Authorization: "Bearer " + auth.accessToken, Accept: "application/json" },
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return fail();
    const payload = await res.json() as Page;
    if (!payload || !Array.isArray(payload.results) ||
        payload.results.length > PAGE_SIZE) return fail();
    const count = payload._meta?.count;
    if (!Number.isSafeInteger(count) || typeof count !== "number" ||
        count < 0 || count > MAX_ACTIONS || (total !== null && total !== count) ||
        offset + payload.results.length > count) return fail();
    total = count;
    all.push(...payload.results as Action[]);
    if (all.length === count) return all;
    if (payload.results.length !== PAGE_SIZE) return fail();
  }
  return fail();
}

export async function loadRevenueReport(period: RevenuePeriod): Promise<RevenueReport> {
  const { start, end } = periodRange(period);
  try {
    return summarizeRevenueActions(await fetchActions(start, end), period);
  } catch {
    // A denied OAuth scope, inaccessible website or malformed provider
    // response must not print sensitive remote content into page/server logs.
    return fail();
  }
}
