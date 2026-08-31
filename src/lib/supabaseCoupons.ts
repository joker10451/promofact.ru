import "server-only";
import type { Coupon } from "@/lib/types";
import { translit } from "@/lib/translit";
import { getSupabase } from "@/lib/supabase";

function str(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

export async function fetchSupabaseCoupons(): Promise<Coupon[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  try {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      // таблица еще не создана или нет доступа — тихо пропускаем, не ломаем сайт
      if (error.message?.includes("does not exist") || error.code === "42P01") return [];
      console.error("[supabase] fetchCoupons error:", error.message);
      return [];
    }
    if (!data || data.length === 0) return [];

    const out: Coupon[] = [];
    for (const row of data as Record<string, unknown>[]) {
      const code = str(row.code);
      // пропускаем без кода — такие не показываем в сетке
      const hasCode = Boolean(code);
      // но если это "скидка по ссылке" (как СберПрайм) — код может быть пустым, показываем
      const bonusName = str(row.bonus_name || row.discount || row.bonusName) || str(row.description)?.slice(0, 80) || null;
      if (!hasCode && !bonusName) continue;

      const storeName = str(row.store) || "Магазин";
      const slug = str(row.store_slug || row.category_slug) ? translit(str(row.store_slug || row.category_slug)) : translit(storeName) || "magazin";
      const storeSlug = str(row.store_slug) ? translit(str(row.store_slug)) || slug : slug;

      const expiresRaw = str(row.expires);
      const expires = expiresRaw ? expiresRaw.slice(0, 10) : null;

      out.push({
        id: Number(row.id) || Math.abs(hashCode(String(row.id || code))),
        promocode: {
          id: Number(row.id) || Math.abs(hashCode(String(row.id || code))),
          code,
          bonusName,
          terms: str(row.terms || row.description) || null,
          expires,
          isHit: Boolean(row.is_hit),
          isUniversal: !Boolean(row.is_first_order_only),
          isFirstOrderOnly: Boolean(row.is_first_order_only),
          region: str(row.region) || "RU",
          isBarcode: false,
          barcodeImage: null,
          group: "supabase",
        },
        store: {
          id: Number(row.id) || 90000,
          name: storeName,
          slug: storeSlug,
          logo: str(row.logo) || `https://www.google.com/s2/favicons?domain=${encodeURIComponent(str(row.site) || "example.com")}&sz=128`,
          category: str(row.category) || "Другое",
          categorySlug: str(row.category_slug) ? translit(str(row.category_slug)) : translit(str(row.category) || "Другое") || "drugoe",
          about: str(row.about) || null,
          conditions: str(row.terms) || null,
          site: str(row.site) || str(row.affiliate_link) || str(row.affiliate_url) || "",
          activeBloggers: 0,
        },
        affiliate: {
          link: str(row.affiliate_link || row.affiliate_url) || str(row.site) || "",
          landingLink: str(row.affiliate_link || row.affiliate_url) || str(row.site) || "",
          ordMarker: str(row.ord_marker) || "",
          ordText: str(row.ord_text) || (str(row.ord_marker) ? `Реклама. erid: ${str(row.ord_marker)}` : "Реклама."),
        },
        extraLinks: [],
      });
    }
    if (out.length > 0) console.log(`[supabase] loaded ${out.length} coupons`);
    return out;
  } catch (e) {
    console.error("[supabase] fetch failed:", e);
    return [];
  }
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
