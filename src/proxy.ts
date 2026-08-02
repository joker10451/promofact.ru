import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

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

    const expected = await sha256Hex(process.env.STATS_PASSWORD ?? "");
    if (request.cookies.get(STATS_COOKIE)?.value !== expected) {
      return NextResponse.redirect(new URL("/stats/login", request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/stats/:path*"],
};
