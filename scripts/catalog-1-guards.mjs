/**
 * CATALOG-1: pure, fail-closed publisher catalog guardrails.
 * Keep identifiers and tracking parameters out of logs/diagnostics.
 */
export const CATALOG_MAX_ROWS = 3000;
export const CATALOG_MAX_NEW = 25;
export const CATALOG_MAX_BASELINE_AGE_HOURS = 168;

function fail(code) {
  const error = new Error(code);
  error.code = code;
  throw error;
}

function validAffiliateLink(link, marker) {
  try {
    const url = new URL(link);
    return url.protocol === "https:" && !url.username && !url.password &&
      !url.port && Boolean(url.hostname) &&
      url.searchParams.get("erid") === marker;
  } catch {
    return false;
  }
}

function expiryTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const date = String(value).slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return NaN;
  const [year, month, day] = date.split("-").map(Number);
  const calendarDate = new Date(Date.UTC(year, month - 1, day));
  if (!Number.isFinite(calendarDate.getTime()) ||
      calendarDate.toISOString().slice(0, 10) !== date) return NaN;
  const ms = Date.parse(date + "T23:59:59+03:00");
  return Number.isFinite(ms) ? ms : NaN;
}

/** All inputs come from a read-only snapshot; no network access or mutation. */
export function examinePublisherSnapshot(rows, meta, nowMs = Date.now()) {
  if (!Array.isArray(rows) || rows.length === 0 || rows.length >= CATALOG_MAX_ROWS)
    fail("CATALOG_SNAPSHOT_EMPTY_OR_TRUNCATED");
  if (!meta || meta.last_status !== "SUCCESS" ||
      !Number.isSafeInteger(Number(meta.last_success_count)) ||
      Number(meta.last_success_count) !== rows.length)
    fail("CATALOG_META_COUNT_MISMATCH");

  const lastAt = Date.parse(meta.last_success_at ?? "");
  if (!Number.isFinite(lastAt) || lastAt > nowMs + 60000)
    fail("CATALOG_META_TIMESTAMP_INVALID");
  const campaigns = new Set();
  const ids = new Set();
  const fingerprints = [];
  let expired = 0, invalid = 0, invalidDates = 0;
  for (const row of rows) {
    const id = String(row.id ?? "");
    const campaign = String(row.source_campaign_id ?? "");
    const coupon = String(row.source_coupon_id ?? "");
    if (!/^[0-9]{1,12}$/.test(campaign) || !/^[0-9]{1,18}$/.test(coupon) ||
        id !== "adm_" + coupon || ids.has(id))
      fail("CATALOG_ID_OR_CAMPAIGN_INVALID");
    ids.add(id);
    campaigns.add(campaign);

    const marker = String(row.ord_marker ?? "").trim();
    const legal = String(row.ord_text ?? "");
    const link = String(row.affiliate_link ?? "");
    if (row.erid_status !== "PRESENT" || row.legal_status !== "PRESENT" ||
        !marker || !legal.includes(marker) || !validAffiliateLink(link, marker))
      invalid++;

    const until = expiryTimestamp(row.expires);
    if (Number.isNaN(until)) invalidDates++;
    else if (until !== null && until < nowMs) expired++;
    fingerprints.push([id, campaign, coupon, String(row.expires ?? ""), marker, link].join("\u001f"));
  }
  fingerprints.sort();
  return {
    count: rows.length,
    campaignCount: campaigns.size,
    campaigns: [...campaigns].sort(),
    expired,
    invalid,
    invalidDates,
    ageHours: Math.max(0, Math.floor((nowMs - lastAt) / 3600000)),
    fingerprint: fingerprints.join("\n"),
    generation: String(meta.last_success_sync_run_id ?? ""),
  };
}

/** No new merchant campaign: only existing publisher campaigns may add coupons. */
export function refreshOptions(overview, mode, explicitlyApproved) {
  if (!overview || overview.invalid > 0 || overview.invalidDates > 0)
    fail("CATALOG_INVALID_ACTIVE_ROWS");
  if (overview.ageHours > CATALOG_MAX_BASELINE_AGE_HOURS)
    fail("CATALOG_BASELINE_TOO_OLD");
  if (mode !== "preview" && mode !== "publish") fail("CATALOG_INVALID_MODE");
  if (mode === "publish" && explicitlyApproved !== true)
    fail("CATALOG_PUBLISH_NOT_APPROVED");
  return {
    skipDbWrite: mode !== "publish",
    requireActiveRetention: true,
    maxNewOffers: CATALOG_MAX_NEW,
    onlyNewCampaignIds: overview.campaigns,
  };
}

export function assertSnapshotUnchanged(before, after) {
  if (!before || !after || before.count !== after.count ||
      before.generation !== after.generation ||
      before.fingerprint !== after.fingerprint)
    fail("CATALOG_SNAPSHOT_CHANGED");
}

export function assertSafeResult(result, overview) {
  if (!result?.success || result.status !== "SUCCESS")
    fail("CATALOG_PREVIEW_REJECTED");
  const proposed = Number(result.aggregates?.publishable);
  if (!Number.isSafeInteger(proposed) || proposed < overview.count - overview.expired)
    fail("CATALOG_RETENTION_CHECK_FAILED");
  return proposed;
}

export function redactedFailure(err) {
  const known = new Set([
    "CATALOG_SNAPSHOT_EMPTY_OR_TRUNCATED","CATALOG_META_COUNT_MISMATCH",
    "CATALOG_META_TIMESTAMP_INVALID","CATALOG_ID_OR_CAMPAIGN_INVALID",
    "CATALOG_INVALID_ACTIVE_ROWS","CATALOG_BASELINE_TOO_OLD",
    "CATALOG_INVALID_MODE","CATALOG_PUBLISH_NOT_APPROVED",
    "CATALOG_SNAPSHOT_CHANGED","CATALOG_PREVIEW_REJECTED",
    "CATALOG_RETENTION_CHECK_FAILED",
  ]);
  return known.has(err?.code) ? err.code : known.has(err?.message) ? err.message : "CATALOG_OPERATION_FAILED";
}
