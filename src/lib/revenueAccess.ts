import "server-only";

import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { STATS_COOKIE, statsCookieValue } from "@/lib/statsAuth";

export const REVENUE_COOKIE = "pf-revenue-session";
const MAX_AGE_SECONDS = 12 * 60 * 60;

function configuredSecret(): string | null {
  const key = process.env.REVENUE_SESSION_SECRET ?? "";
  return key.length >= 32 ? key : null;
}

export function revenueAccessConfigured(): boolean {
  const pass = process.env.REVENUE_DASHBOARD_PASSWORD ?? "";
  return pass.length >= 16 && Boolean(configuredSecret());
}

function safeMatch(a: string, b: string): boolean {
  const first = Buffer.from(a, "utf8");
  const second = Buffer.from(b, "utf8");
  return first.length === second.length && timingSafeEqual(first, second);
}

function hmac(value: string, key: string): string {
  return createHmac("sha256", key).update(value).digest("hex");
}

export function revenuePasswordMatches(input: string): boolean {
  if (!revenueAccessConfigured() || input.length > 512) return false;
  const actual = createHash("sha256").update(input).digest("hex");
  const wanted = createHash("sha256")
    .update(process.env.REVENUE_DASHBOARD_PASSWORD ?? "")
    .digest("hex");
  return safeMatch(actual, wanted);
}

export function createRevenueSession(now = Date.now()): string {
  const key = configuredSecret();
  if (!revenueAccessConfigured() || !key) throw new Error("REVENUE_NOT_CONFIGURED");
  const payload = "v1." + String(Math.floor(now / 1000) + MAX_AGE_SECONDS)
    + "." + randomBytes(16).toString("hex");
  return payload + "." + hmac(payload, key);
}

export function verifyRevenueSession(token: string | undefined, now = Date.now()): boolean {
  const key = configuredSecret();
  if (!revenueAccessConfigured() || !key || !token || token.length > 240) return false;
  const match = /^v1\.([0-9]{10,12})\.([a-f0-9]{32})\.([a-f0-9]{64})$/.exec(token);
  if (!match) return false;
  const expiry = Number(match[1]);
  const current = Math.floor(now / 1000);
  if (!Number.isSafeInteger(expiry) || expiry <= current ||
      expiry > current + MAX_AGE_SECONDS) return false;
  const payload = "v1." + match[1] + "." + match[2];
  return safeMatch(match[3], hmac(payload, key));
}

export async function hasStatsAccess(): Promise<boolean> {
  const expected = await statsCookieValue();
  if (!expected) return false;
  const supplied = (await cookies()).get(STATS_COOKIE)?.value;
  return typeof supplied === "string" && safeMatch(supplied, expected);
}

export async function hasRevenueAccess(): Promise<boolean> {
  if (!(await hasStatsAccess())) return false;
  return verifyRevenueSession((await cookies()).get(REVENUE_COOKIE)?.value);
}

export const REVENUE_SESSION_AGE_SECONDS = MAX_AGE_SECONDS;
