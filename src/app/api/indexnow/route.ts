import { NextRequest, NextResponse } from "next/server";
import { isBearerAuthorized } from "@/lib/apiAuth";

const INDEXNOW_KEY = "c62c55b32f449cc4602687e29849f898";
const HOST = "promofact.ru";

const ENDPOINTS = [
  "https://yandex.com/indexnow",
  "https://www.bing.com/indexnow",
  "https://api.indexnow.org/indexnow",
];

export async function POST(req: NextRequest) {
  if (!isBearerAuthorized(req.headers.get("authorization"), [process.env.INDEXNOW_SECRET, process.env.CRON_SECRET])) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }
  let urls: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.urlList)) urls = body.urlList;
    else if (typeof body?.url === "string") urls = [body.url];
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  // Фильтруем URL: разрешены только канонические страницы с нашего домена
  if (urls.length > 10000) return NextResponse.json({ ok: false, error: "Too many URLs" }, { status: 400 });
  const cleanUrls = [...new Set(urls
    .map((u) => (typeof u === "string" ? u.trim() : ""))
    .filter((u) => {
      try {
        const parsed = new URL(u);
        return parsed.protocol === "https:" && parsed.hostname === HOST && !parsed.port && !parsed.username && !parsed.password;
      } catch { return false; }
    }))];

  if (!cleanUrls.length) {
    return NextResponse.json({ ok: false, error: "no valid URLs for host " + HOST }, { status: 400 });
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: cleanUrls,
  };

  const results = await Promise.allSettled(
    ENDPOINTS.map((ep) =>
      fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10000),
      })
    )
  );

  const statuses = results.map((r) => r.status === "fulfilled" ? r.value.status : null);
  const sent = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
  return NextResponse.json({ ok: sent > 0, sent, total: ENDPOINTS.length, statuses }, { status: sent > 0 ? 200 : 502 });
}

// Защита: GET не обрабатываем (ключ публикуется как .txt в public)
export function GET() {
  return NextResponse.json({ ok: false, error: "method not allowed" }, { status: 405 });
}
