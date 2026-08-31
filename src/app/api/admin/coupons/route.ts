import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { STATS_COOKIE, statsCookieValue } from "@/lib/statsAuth";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

async function isAuthed(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(STATS_COOKIE)?.value;
  if (!token) return false;
  const expected = await statsCookieValue();
  return Boolean(expected && token === expected);
}

function bad(msg: string, status = 400) {
  return NextResponse.json({ error: msg }, { status });
}

// GET — список купонов (для админки)
export async function GET() {
  if (!(await isAuthed())) return bad("Unauthorized", 401);
  const supabase = getSupabase();
  if (!supabase) return bad("Supabase не настроен (нет NEXT_PUBLIC_SUPABASE_URL/ANON_KEY)", 500);
  const { data, error } = await supabase.from("coupons").select("*").order("created_at", { ascending: false }).limit(500);
  if (error) return bad(error.message, 500);
  return NextResponse.json({ data });
}

// POST — создать или обновить (upsert по id/code+store_slug)
export async function POST(req: NextRequest) {
  if (!(await isAuthed())) return bad("Unauthorized", 401);
  const supabase = getSupabase();
  if (!supabase) return bad("Supabase не настроен", 500);

  const body = await req.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return bad("Invalid JSON");

  const id = String(body.id ?? "").trim() || `${Date.now()}`;
  const code = String(body.code ?? "").trim();
  const store = String(body.store ?? "").trim();
  if (!store) return bad("Поле store обязательно");
  // code может быть пустым для "скидка по ссылке" (как СберПрайм)

  const row: Record<string, unknown> = {
    id,
    code,
    store,
    store_slug: String(body.store_slug ?? body.storeSlug ?? "").trim() || store.toLowerCase().replace(/[^a-z0-9а-я]+/gi, "-").replace(/^-|-$/g, ""),
    discount: String(body.discount ?? body.bonus_name ?? body.bonusName ?? "").trim() || "Скидка по промокоду",
    category: String(body.category ?? "").trim() || "Другое",
    description: String(body.description ?? body.terms ?? "").trim() || null,
    expires: body.expires ? String(body.expires).slice(0, 10) : null,
    affiliate_url: String(body.affiliate_url ?? body.affiliate_link ?? body.affiliateLink ?? "").trim() || null,
    // расширенные поля (если колонки есть — запишутся, если нет — игнор)
    bonus_name: String(body.bonus_name ?? body.bonusName ?? body.discount ?? "").trim() || null,
    terms: String(body.terms ?? body.description ?? "").trim() || null,
    affiliate_link: String(body.affiliate_link ?? body.affiliate_url ?? "").trim() || null,
    ord_marker: String(body.ord_marker ?? body.ordMarker ?? "").trim() || null,
    ord_text: String(body.ord_text ?? body.ordText ?? "").trim() || null,
    logo: String(body.logo ?? "").trim() || null,
    site: String(body.site ?? "").trim() || null,
    category_slug: String(body.category_slug ?? body.categorySlug ?? "").trim() || null,
    is_hit: Boolean(body.is_hit ?? body.isHit),
    is_first_order_only: Boolean(body.is_first_order_only ?? body.isFirstOrderOnly),
    region: String(body.region ?? "RU").trim() || "RU",
    is_active: body.is_active !== false,
  };

  const { data, error } = await supabase.from("coupons").upsert(row, { onConflict: "id" }).select().single();
  if (error) return bad(error.message, 500);
  return NextResponse.json({ data });
}

// DELETE — ?id=xxx
export async function DELETE(req: NextRequest) {
  if (!(await isAuthed())) return bad("Unauthorized", 401);
  const supabase = getSupabase();
  if (!supabase) return bad("Supabase не настроен", 500);
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return bad("Нужен ?id=");
  const { error } = await supabase.from("coupons").delete().eq("id", id);
  if (error) return bad(error.message, 500);
  return NextResponse.json({ ok: true });
}
