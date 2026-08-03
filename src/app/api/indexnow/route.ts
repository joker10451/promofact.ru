import { NextRequest, NextResponse } from "next/server";

const INDEXNOW_KEY = "c62c55b32f449cc4602687e29849f898";
const HOST = "promofact.ru";

const ENDPOINTS = [
  "https://yandex.com/indexnow",
  "https://www.bing.com/indexnow",
  "https://api.indexnow.org/indexnow",
];

export async function POST(req: NextRequest) {
  let urls: string[] = [];
  try {
    const body = await req.json();
    if (Array.isArray(body?.urlList)) urls = body.urlList;
    else if (typeof body?.url === "string") urls = [body.url];
  } catch {
    return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 });
  }

  if (!urls.length) {
    return NextResponse.json({ ok: false, error: "empty urlList" }, { status: 400 });
  }

  const payload = {
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: `https://${HOST}/${INDEXNOW_KEY}.txt`,
    urlList: urls,
  };

  const results = await Promise.allSettled(
    ENDPOINTS.map((ep) =>
      fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify(payload),
      })
    )
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ ok: true, sent, total: ENDPOINTS.length });
}

// Защита: GET не обрабатываем (ключ публикуется как .txt в public)
export function GET() {
  return NextResponse.json({ ok: false, error: "method not allowed" }, { status: 405 });
}
