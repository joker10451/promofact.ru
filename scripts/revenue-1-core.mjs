/**
 * REVENUE-1: pure accounting for official Admitad Statistics API action rows.
 * Never count a click, a coupon copy, or a Perfluence feed item as a paid order.
 * No customer identifiers, raw promocodes or click IDs are persisted or logged.
 */
export const ACTION_STATES = Object.freeze([
  "pending", "approved", "approved_but_stalled", "declined", "unknown",
]);
const knownStates = new Set(ACTION_STATES);
const moneyStates = Object.freeze({
  pending: "pending",
  approved: "approved",
  approved_but_stalled: "stalled",
  declined: "declined",
  unknown: "unknown",
});
export function revenueError(code) {
  const err = new Error(code);
  err.code = code;
  return err;
}
function assertCondition(condition, code) {
  if (!condition) throw revenueError(code);
}
function currencyCode(raw) {
  const c = String(raw ?? "").trim().toUpperCase();
  assertCondition(/^[A-Z]{3}$/.test(c), "REVENUE_INVALID_CURRENCY");
  return c;
}
function commissionMinorUnits(raw) {
  assertCondition(
    (typeof raw === "number" && Number.isFinite(raw)) ||
      (typeof raw === "string" && /^-?[0-9]+(?:\.[0-9]{1,6})?$/.test(raw.trim())),
    "REVENUE_INVALID_AMOUNT",
  );
  const amount = Number(raw);
  assertCondition(Number.isFinite(amount) && Math.abs(amount) < 1e10,
    "REVENUE_INVALID_AMOUNT");
  const cents = Math.round(amount * 100);
  assertCondition(Number.isSafeInteger(cents), "REVENUE_INVALID_AMOUNT");
  return cents;
}
export function normalizeAdmitadAction(raw) {
  assertCondition(raw && typeof raw === "object" && !Array.isArray(raw),
    "REVENUE_INVALID_ACTION");
  const id = String(raw.action_id ?? "");
  assertCondition(/^[0-9]{1,18}$/.test(id), "REVENUE_INVALID_ACTION_ID");
  const campaignId = String(raw.advcampaign_id ?? "");
  assertCondition(/^[0-9]{1,12}$/.test(campaignId), "REVENUE_INVALID_CAMPAIGN");
  const status = String(raw.status ?? "").toLowerCase();
  // Unknown statuses are not accepted as earnings but still visible as unknown.
  const state = knownStates.has(status) ? status : "unknown";
  const kind = raw.action_type === "sale" ? "sale"
    : raw.action_type === "lead" ? "lead" : "other";
  const paid = raw.paid === 1 || raw.paid === "1" || raw.paid === true;
  const sourceTag = raw.subid3 === "promofact" ? "promofact" : "unattributed";
  // Do not include any original order ID, coupon code, email, click ID or SubID.
  return {
    id,
    campaignId,
    state,
    currency: currencyCode(raw.currency),
    cents: commissionMinorUnits(raw.payment),
    kind,
    paid,
    sourceTag,
  };
}
export function aggregateAdmitadActions(input) {
  assertCondition(Array.isArray(input), "REVENUE_ACTIONS_ARRAY_REQUIRED");
  const deduped = new Map();
  for (const original of input) {
    const a = normalizeAdmitadAction(original);
    const previous = deduped.get(a.id);
    if (previous && JSON.stringify(previous) !== JSON.stringify(a))
      throw revenueError("REVENUE_CONFLICTING_ACTION_ID");
    deduped.set(a.id, a);
  }
  const currencies = new Map();
  const byCampaign = new Map();
  const fresh = () => ({
    actions: 0, sales: 0, leads: 0, paidActions: 0,
    taggedActions: 0, untaggedActions: 0,
    approved: 0, pending: 0, stalled: 0, declined: 0, unknown: 0,
    approvedCount: 0, pendingCount: 0, stalledCount: 0,
    declinedCount: 0, unknownCount: 0,
  });
  function tally(target, a) {
    target.actions++;
    if (a.kind === "sale") target.sales++;
    if (a.kind === "lead") target.leads++;
    // Payout indicator is meaningful only for officially approved actions.
    if (a.paid && a.state === "approved") target.paidActions++;
    if (a.sourceTag === "promofact") target.taggedActions++;
    else target.untaggedActions++;
    const col = moneyStates[a.state];
    target[col] += a.cents;
    const countName = col + "Count";
    target[countName]++;
  }
  for (const a of deduped.values()) {
    if (!currencies.has(a.currency)) currencies.set(a.currency, fresh());
    const k = a.campaignId + "|" + a.currency;
    if (!byCampaign.has(k)) byCampaign.set(k, { campaignId: a.campaignId, currency: a.currency, ...fresh() });
    tally(currencies.get(a.currency), a);
    tally(byCampaign.get(k), a);
  }
  const centsAsMoney = (o) => {
    const ret = { ...o };
    for (const k of ["approved", "pending", "stalled", "declined", "unknown"])
      ret[k] = o[k] / 100;
    return ret;
  };
  return {
    source: "admitad",
    recordType: "actions",
    attribution: "website-scoped; sourceTag indicates SubID3=promofact",
    currencies: Object.fromEntries([...currencies.entries()].sort()
      .map(([key, val]) => [key, centsAsMoney(val)])),
    campaigns: [...byCampaign.values()]
      .sort((a,b) => a.campaignId.localeCompare(b.campaignId) || a.currency.localeCompare(b.currency))
      .map(centsAsMoney),
  };
}
export function verifyAdmitadPage(response, limit, offset) {
  assertCondition(response && typeof response === "object" && !Array.isArray(response) &&
    Array.isArray(response.results) && response.results.length <= limit,
    "REVENUE_INVALID_PAGE");
  const count = response._meta?.count;
  assertCondition(Number.isSafeInteger(count) && count >= 0 && count <= 5000,
    "REVENUE_INVALID_PAGE_META");
  assertCondition(offset + response.results.length <= count,
    "REVENUE_PAGE_COUNT_MISMATCH");
  if (offset + response.results.length < count)
    assertCondition(response.results.length > 0, "REVENUE_PAGE_INCOMPLETE");
  return count;
}
export function revenueDateParam(input) {
  const d = String(input ?? "");
  assertCondition(/^\d{4}-\d{2}-\d{2}$/.test(d) &&
    !Number.isNaN(Date.parse(d + "T00:00:00Z")) &&
    new Date(d + "T00:00:00Z").toISOString().slice(0,10) === d,
    "REVENUE_INVALID_DATE");
  return d.slice(8,10) + "." + d.slice(5,7) + "." + d.slice(0,4);
}
export function safePublicPreview(aggregated) {
  // Never print amounts, action IDs, click IDs, coupons or merchant names in public CI logs.
  return {
    apiReachable: true,
    currencies: Object.keys(aggregated.currencies),
    hasActions: aggregated.campaigns.length > 0,
    status: "PRIVATE_AMOUNTS_REDACTED",
  };
}
/**
 * Perfluence results feed has no verified documented status schema in this project.
 * Do not interpret its fee field as an approved commission or payout.
 */
export function examinePerfluenceFeed(body) {
  if (!body || !Array.isArray(body.data))
    throw revenueError("REVENUE_PERFLUENCE_FEED_SCHEMA_UNKNOWN");
  return {
    source: "perfluence",
    feedRows: body.data.length,
    approvalStatus: "unverified",
    approvedCommission: null,
    paidCommission: null,
  };
}
export function safeRevenueFailure(err) {
  const codes = new Set([
    "REVENUE_INVALID_CURRENCY","REVENUE_INVALID_AMOUNT","REVENUE_INVALID_ACTION",
    "REVENUE_INVALID_ACTION_ID","REVENUE_INVALID_CAMPAIGN",
    "REVENUE_ACTIONS_ARRAY_REQUIRED","REVENUE_CONFLICTING_ACTION_ID",
    "REVENUE_INVALID_PAGE","REVENUE_INVALID_PAGE_META",
    "REVENUE_PAGE_COUNT_MISMATCH","REVENUE_PAGE_INCOMPLETE",
    "REVENUE_INVALID_DATE","REVENUE_PERFLUENCE_FEED_SCHEMA_UNKNOWN",
    "REVENUE_API_DENIED","REVENUE_OAUTH_SCOPE_MISSING",
    "REVENUE_API_ERROR","REVENUE_PAGINATION_CAP",
    "REVENUE_MISSING_CREDENTIALS","REVENUE_INVALID_WEBSITE",
    "REVENUE_DATE_RANGE_TOO_LARGE"
  ]);
  return codes.has(err?.code) ? err.code
    : codes.has(err?.message) ? err.message : "REVENUE_UNEXPECTED_ERROR";
}
