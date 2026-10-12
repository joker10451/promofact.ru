import { isIP } from "node:net";

const PILOT_HOST = "dkfrh.com";
const PILOT_PATH = "/g/va69o33134c7dde8999c9ebcee8c5e/";
const PILOT_CODE = "TKPRDM-UYVG1GJO";
const PILOT_SLUG = "tasty-coffee";

export function isTeleportPilotCoupon(c: {
  store: { slug: string };
  promocode: { code: string; group: string | null };
}): boolean {
  return c.store.slug === PILOT_SLUG &&
    c.promocode.group === "admitad" &&
    c.promocode.code === PILOT_CODE;
}

/** Strict tracking-domain allowlist. No arbitrary client-provided destination. */
export function isVerifiedTastyAffiliateLink(source: string, expectedErid: string): boolean {
  try {
    const u = new URL(source);
    return u.protocol === "https:" &&
      u.hostname === PILOT_HOST &&
      !u.port && !u.username && !u.password &&
      u.pathname === PILOT_PATH &&
      u.searchParams.get("i") === "31" &&
      /^[A-Za-z0-9_-]{12,80}$/.test(expectedErid) &&
      u.searchParams.get("erid") === expectedErid;
  } catch {
    return false;
  }
}

function isPublicIp(ip: string): boolean {
  const ver = isIP(ip);
  if (!ver) return false;
  if (ver === 4) {
    const a = ip.split(".").map(Number);
    if (a[0] === 0 || a[0] === 10 || a[0] === 127 || a[0] >= 224 ||
      (a[0] === 100 && a[1] >= 64 && a[1] <= 127) ||
      (a[0] === 169 && a[1] === 254) ||
      (a[0] === 172 && a[1] >= 16 && a[1] <= 31) ||
      (a[0] === 192 && a[1] === 168) ||
      (a[0] === 192 && a[1] === 0 && a[2] === 0) ||
      (a[0] === 198 && (a[1] === 18 || a[1] === 19)) ||
      (a[0] === 192 && a[1] === 0 && a[2] === 2) ||
      (a[0] === 198 && a[1] === 51 && a[2] === 100) ||
      (a[0] === 203 && a[1] === 0 && a[2] === 113)) return false;
  } else {
    const low = ip.toLowerCase();
    if (low === "::1" || low === "::" || low.startsWith("fc") ||
      low.startsWith("fd") || low.startsWith("fe8") || low.startsWith("fe9") ||
      low.startsWith("fea") || low.startsWith("feb") || low.startsWith("2001:db8:") ||
      low.startsWith("::ffff:")) return false;
  }
  return true;
}

/** Do not guess server IP, take exactly one validated proxy-provided visitor IP. */
export function getTeleportVisitorIp(forwarded: string | null): string | null {
  if (!forwarded || forwarded.includes(",")) return null;
  const ip = forwarded.trim();
  return isPublicIp(ip) ? ip : null;
}

export function makeTeleportUrl(
  affiliateUrl: string,
  data: { ip: string; userAgent: string; referer: string; country?: string | null },
): string | null {
  if (!isPublicIp(data.ip) || data.userAgent.length < 10 || data.userAgent.length > 512 ||
    !/^https:\/\/[a-z0-9.-]+$/i.test(data.referer)) return null;
  try {
    const u = new URL(affiliateUrl);
    if (u.protocol !== "https:" || u.hostname !== PILOT_HOST || u.pathname !== PILOT_PATH) return null;
    u.pathname = u.pathname.replace(/^\/g\//, "/tptv2/");
    u.searchParams.set("ip_addr", data.ip);
    u.searchParams.set("user_agent", data.userAgent);
    u.searchParams.set("referer", data.referer);
    if (data.country && /^[A-Z]{2}$/.test(data.country)) {
      u.searchParams.set("country_code", data.country);
    }
    return u.toString();
  } catch {
    return null;
  }
}

/** Teleport response is a JSON array, never a browser-readable redirect itself. */
export function parseTeleportDestination(body: unknown): string | null {
  if (!Array.isArray(body) || body.length !== 1 || typeof body[0] !== "string") return null;
  try {
    const u = new URL(body[0]);
    // Fail closed on Admitad dummy pages, URL scheme tricks or unknown redirectors.
    if (u.protocol !== "https:" || u.port || u.username || u.password) return null;
    if (u.hostname !== "tastycoffee.ru" && !u.hostname.endsWith(".tastycoffee.ru")) return null;
    return u.toString();
  } catch {
    return null;
  }
}

export function makeTeleportPilotPath(couponId: number, placement: string, clickId: string): string {
  const q = new URLSearchParams();
  q.set("placement", placement);
  q.set("click_id", clickId);
  return `/go/admitad/${couponId}?${q.toString()}`;
}
