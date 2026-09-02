import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  LEGACY_STORE_REDIRECTS,
  LEGACY_CATEGORY_REDIRECTS,
} from "@/lib/legacyRedirects";

const STATS_COOKIE = "stats-auth";

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/stats" || pathname.startsWith("/stats/")) {
    if (pathname === "/stats/login") return NextResponse.next();

    // Если пароль не задан — доступа нет ни у кого. Раньше здесь считался
    // sha256("") (общеизвестная константа), и /stats открывался по ней.
    const password = process.env.STATS_PASSWORD;
    if (!password) {
      return NextResponse.redirect(new URL("/stats/login", request.url));
    }
    const expected = await sha256Hex(password);
    if (request.cookies.get(STATS_COOKIE)?.value !== expected) {
      return NextResponse.redirect(new URL("/stats/login", request.url));
    }
    return NextResponse.next();
  }

  // 301-редиректы устаревших slug'ов магазинов/категорий на живые разделы
  const storeMatch = pathname.match(/^\/store\/([^/]+)$/);
  if (storeMatch) {
    const target = LEGACY_STORE_REDIRECTS[storeMatch[1]];
    if (target) {
      return NextResponse.redirect(new URL(target, request.url), 301);
    }
  }
  const catMatch = pathname.match(/^\/category\/([^/]+)$/);
  if (catMatch) {
    const target = LEGACY_CATEGORY_REDIRECTS[catMatch[1]];
    if (target) {
      return NextResponse.redirect(new URL(target, request.url), 301);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/stats/:path*", "/store/:path*", "/category/:path*"],
};
