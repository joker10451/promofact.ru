/**
 * Public-read eligibility for coupons already published by the trusted
 * site-scoped Admitad snapshot RPC. Publication authority is the ACTIVE,
 * verified row in Supabase, NOT the historical initial campaign allowlist.
 * Do not call this for untrusted imported data before atomic publication.
 */
export function isPublicAdmitadRow(row: Record<string, unknown>, nowMs = Date.now()): boolean {
  if (row.is_active !== true || row.sync_status !== "PUBLISHABLE" ||
      row.legal_status !== "PRESENT" || row.erid_status !== "PRESENT") return false;
  const marker = String(row.ord_marker || "").trim();
  const legalText = String(row.ord_text || "").trim();
  const slug = String(row.store_slug || "").trim();
  const campaignId = String(row.source_campaign_id || "").trim();
  if (!marker || !legalText.includes(marker) ||
      !legalText.toLowerCase().includes("реклама") ||
      !slug || slug === "unmapped" || !/^[0-9]{1,12}$/.test(campaignId)) return false;
  try {
    const url = new URL(String(row.affiliate_link || row.affiliate_url || ""));
    if (url.protocol !== "https:" || url.username || url.password || url.port ||
        !url.hostname.includes(".") || url.searchParams.get("erid") !== marker) return false;
  } catch { return false; }
  const expires = row.expires;
  if (expires != null && String(expires).trim() !== "") {
    const value = String(expires).slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const expiryMs = Date.parse(value + "T23:59:59+03:00");
    if (!Number.isFinite(expiryMs) || expiryMs < nowMs) return false;
  }
  return true;
}
