import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getCoupons } from "@/lib/perfluence";
import { decorateAdmitadUrl } from "@/lib/admitadAutopilot";
import {
  getTeleportVisitorIp,
  isTeleportPilotCoupon,
  isVerifiedTastyAffiliateLink,
  makeTeleportUrl,
  parseTeleportDestination,
} from "@/lib/admitadTeleport";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const revalidate = 0;

const PLACEMENTS = new Set([
  "home_catalog", "home_hot_deals", "store_coupon", "article_coupon",
  "category_coupon", "collection_coupon", "geo_city_coupon",
  "geo_category_coupon", "coupon_detail", "unknown",
]);

/**
 * QA-only aggregate-friendly event. Deliberately never log request headers,
 * IP, user-agent, full URLs, query parameters, coupon IDs or click IDs.
 * Counts can be grouped by outcome/reason in Vercel runtime logs.
 */
function recordTeleportOutcome(outcome: "success" | "fallback", reason: string): void {
  console.info(JSON.stringify({
    event: "admitad_teleport",
    store: "tasty-coffee",
    outcome,
    reason,
  }));
}

function isClassicTeleportResponse(body: unknown): boolean {
  if (!Array.isArray(body) || body.length !== 1 || typeof body[0] !== "string") return false;
  try {
    const url = new URL(body[0]);
    return url.protocol === "https:" && url.hostname === "dkfrh.com" && url.pathname.startsWith("/g/");
  } catch {
    return false;
  }
}

function redirectNoStore(destination: string, variant: "teleport" | "classic") {
  const response = NextResponse.redirect(destination, 302);
  response.headers.set("Cache-Control", "private, no-store, max-age=0");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Promofact-Transport", variant);
  return response;
}

/**
 * Teleport opt-in pilot. No user-supplied destination is accepted.
 * Both toggles default to OFF. Any missing context falls back to the original
 * approved affiliate link with its untouched ERID and SubIDs.
 */
export async function GET(req: NextRequest, context: { params: Promise<{ couponId: string }> }) {
  const { couponId } = await context.params;
  if (!/^\d{1,12}$/.test(couponId)) return new Response("Not found", { status: 404 });
  const id = Number(couponId);

  const coupon = (await getCoupons()).find(
    (c) => c.id === id && isTeleportPilotCoupon(c),
  );
  if (!coupon || !isVerifiedTastyAffiliateLink(coupon.affiliate.link, coupon.affiliate.ordMarker)) {
    return new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });
  }

  const p = new URL(req.url).searchParams;
  const placement = p.get("placement") || "";
  const safePlacement = PLACEMENTS.has(placement) ? placement : "unknown";
  const clickId = p.get("click_id") || "";
  const url = decorateAdmitadUrl(coupon.affiliate.link, {
    placement: safePlacement,
    pageType: safePlacement.startsWith("store") ? "store" : safePlacement.startsWith("home") ? "home" : "other",
    couponId: coupon.id,
    ...( /^[0-9a-f]{8}-[0-9a-f-]{27,38}$/i.test(clickId) ? { clickId } : {}),
  });

  const fallback = (reason: string) => {
    recordTeleportOutcome("fallback", reason);
    return redirectNoStore(url, "classic");
  };
  if (process.env.ADMITAD_TELEPORT_PILOT_ENABLED !== "true") return fallback("feature_disabled");
  if (process.env.VERCEL !== "1") return fallback("not_vercel");
  if (req.cookies.get("promofact_teleport_consent")?.value !== "yes") return fallback("no_consent");

  // Teleport performs a server-side disclosure of the visitor IP and UA.
  // Only accept genuine user navigations initiated from PromoFact.
  const origin = req.headers.get("referer");
  if (!origin) return fallback("missing_referer");
  try {
    if (new URL(origin).origin !== new URL(SITE_URL).origin) return fallback("different_origin");
  } catch {
    return fallback("invalid_referer");
  }
  const fetchSite = req.headers.get("sec-fetch-site");
  const fetchUser = req.headers.get("sec-fetch-user");
  // Require explicit user activation from this origin. Browsers that do not
  // send Fetch Metadata use the standard affiliate link, not a Teleport call.
  if (fetchSite !== "same-origin" || fetchUser !== "?1") return fallback("no_user_activation");

  const ua = req.headers.get("user-agent") || "";
  if (!ua || /bot|crawler|spider|headless/i.test(ua)) return fallback("invalid_user_agent");
  const ip = getTeleportVisitorIp(req.headers.get("x-forwarded-for"));
  if (!ip) return fallback("invalid_visitor_ip");

  const country = req.headers.get("x-vercel-ip-country");
  const apiUrl = makeTeleportUrl(url, {
    ip,
    userAgent: ua,
    referer: new URL(SITE_URL).origin,
    country,
  });
  if (!apiUrl) return fallback("invalid_teleport_url");

  try {
    const response = await fetch(apiUrl, {
      method: "GET",
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
      headers: { Accept: "application/json" },
    });
    if (!response.ok) return fallback("teleport_http_error");
    const text = await response.text();
    if (text.length > 8192) return fallback("oversized_response");
    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      return fallback("invalid_json");
    }
    const destination = parseTeleportDestination(body);
    if (!destination) return fallback(isClassicTeleportResponse(body) ? "classic_response" : "invalid_destination");
    recordTeleportOutcome("success", "valid_merchant_redirect");
    return redirectNoStore(destination, "teleport");
  } catch (error) {
    return fallback(error instanceof Error && error.name === "TimeoutError"
      ? "teleport_timeout" : "teleport_request_error");
  }
}
