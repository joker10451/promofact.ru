/**
 * Public-read eligibility for coupons already published by the trusted
 * site-scoped Admitad snapshot RPC. Publication authority is the ACTIVE,
 * verified row in Supabase, NOT the historical initial campaign allowlist.
 * Do not call this for untrusted imported data before atomic publication.
 */
/**
 * 14 Oct 2026: Admitad/Mitgo support explicitly denied publisher access to
 * these three RU-only programs for the existing publisher account because
 * of its registered country. A site-scoped coupons API row is NOT proof
 * of authorization (case in support correspondence dated 2026-10-14).
 *
 * Keep historical rows for audit; never serve them to visitors until
 * eligibility is independently confirmed for this actual account.
 * Do not reuse this list as an account-agnostic global advertiser blacklist.
 */
export const DENIED_ADMITAD_CAMPAIGN_IDS = new Set(["2402", "19773", "19328"]);

export function isPublicAdmitadRow(row: Record<string, unknown>, nowMs = Date.now()): boolean {
  if (row.is_active !== true || row.sync_status !== "PUBLISHABLE" ||
      row.legal_status !== "PRESENT" || row.erid_status !== "PRESENT") return false;
  const marker = String(row.ord_marker || "").trim();
  const legalText = String(row.ord_text || "").trim();
  const slug = String(row.store_slug || "").trim();
  const campaignId = String(row.source_campaign_id || "").trim();
  // Publisher account restriction overrides technical validity and API presence.
  if (DENIED_ADMITAD_CAMPAIGN_IDS.has(campaignId)) return false;
  if (!marker || !legalText.includes(marker) ||
      !legalText.toLowerCase().includes("реклама") ||
      !slug || slug === "unmapped" || !/^[0-9]{1,12}$/.test(campaignId)) return false;
  try {
    const url = new URL(String(row.affiliate_link || row.affiliate_url || ""));
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        !url.hostname.includes(".") || url.searchParams.get("erid") !== marker) return false;
  } catch { return false; }
  // Online coupon links cannot fulfill explicitly offline-only promotions.
  // Do not silently turn "only in physical stores" into an online checkout CTA.
  const text = String(row.terms || row.description || "").toLowerCase();
  if (/только\s+в\s+розничных\s+магазинах|только\s+офлайн|исключительно\s+в\s+магазинах|в\s+офлайн-магазинах/i.test(text)) return false;
  const expires = row.expires;
  if (expires != null && String(expires).trim() !== "") {
    const value = String(expires).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const expiryMs = Date.parse(value + "T23:59:59+03:00");
    if (!Number.isFinite(expiryMs) || expiryMs < nowMs) return false;
  }
  return true;
}
