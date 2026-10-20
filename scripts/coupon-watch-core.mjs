import { createHash } from "node:crypto";
import { isCouponActive, expiryTimestamp } from "../src/lib/couponExpiry.ts";
import { isRealPromoCode, normalizeCode } from "../src/lib/dedupe.ts";

const TOKEN = /\berid\s*[:=]\s*([a-z0-9]{8,40})\b/i;
const MAX_MESSAGES = 50;
const toStr = (value) => typeof value === "string" ? value.trim() : "";
const fingerprint = (s) => createHash("sha256").update(s).digest("hex").slice(0, 16);

export function inspectCoupons(coupons, source, now = Date.now()) {
  const records = {};
  const findings = [];
  const expiring = [];
  let activeCount = 0;
  let codeCount = 0;
  let noCodeCount = 0;
  let expiredCount = 0;
  for (const coupon of coupons) {
    const p = coupon.promocode || {};
    const store = coupon.store || {};
    const affiliate = coupon.affiliate || {};
    const expires = toStr(p.expires);
    if (!isCouponActive(expires || null, now)) {
      expiredCount++;
      continue;
    }
    activeCount++;
    const realCode = isRealPromoCode(p.code);
    const kind = p.isBarcode ? "barcode" : realCode ? "code" : "deal";
    if (kind === "code") codeCount++;
    else noCodeCount++;
    const slug = toStr(store.slug) || "unknown";
    const code = realCode ? normalizeCode(p.code) : "";
    const key = source + "|" + slug + "|" + (kind === "deal" ? "deal:" + String(p.id ?? coupon.id) : kind + ":" + code);
    const link = toStr(affiliate.link || affiliate.landingLink);
    const declared = toStr(affiliate.ordMarker);
    const fromText = toStr(affiliate.ordText).match(TOKEN)?.[1] || "";
    const dateMs = expiryTimestamp(expires);
    let domain = "";
    let linkToken = "";
    try {
      const url = new URL(link);
      if (!["https:", "http:"].includes(url.protocol)) throw new Error("bad protocol");
      domain = url.hostname.toLowerCase();
      linkToken = url.searchParams.get("erid") || "";
      if (domain === "prfl.me" || domain.endsWith(".prfl.me")) {
        if (!linkToken) {
          findings.push({ severity: "critical", source, code, slug, detail: "Партнёрская ссылка prfl.me без параметра erid" });
        }
      }
    } catch {
      findings.push({ severity: "critical", source, code, slug, detail: "Отсутствует корректная ссылка HTTP(S)" });
    }
    if (declared && fromText && declared !== fromText) {
      findings.push({ severity: "critical", source, code, slug, detail: "ERID в тексте отличается от поля ordMarker" });
    }
    if (linkToken && (declared || fromText) && linkToken !== (declared || fromText)) {
      findings.push({ severity: "critical", source, code, slug, detail: "ERID в ссылке отличается от маркировки" });
    }
    if (!declared && !fromText && !linkToken) {
      // Ingestion may place the disclosure on the campaign group rather than
      // individual coupons: do not claim that such a record is definitely illegal.
      findings.push({ severity: source === "manual" ? "critical" : "warning", source, code, slug, detail: "ERID не найден в данных предложения, нужна ручная проверка" });
    }
    if (records[key]) {
      if (records[key].fingerprint !== fingerprint([link, declared, fromText, expires, toStr(p.bonusName)].join("|"))) {
        findings.push({ severity: "warning", source, code, slug, detail: "Одинаковый код магазина имеет разные ссылки или условия внутри одного источника" });
      }
    }
    const remaining = dateMs - now;
    if (source === "manual" && Number.isFinite(dateMs) && remaining > 0 && remaining < 48 * 3600_000) {
      expiring.push({ key, code: code || "(без кода)", slug, expires, remainingHours: Math.ceil(remaining / 3600_000) });
    }
    records[key] = {
      key, source, slug, code, kind, expires,
      domain, erid: declared || fromText || linkToken,
      bonus: toStr(p.bonusName).slice(0, 100),
      fingerprint: fingerprint([link, declared, fromText, expires, toStr(p.bonusName)].join("|")),
    };
  }
  return { source, records, findings: findings.slice(0, MAX_MESSAGES), expiring, activeCount, codeCount, noCodeCount, expiredCount };
}

export function compareInventories(previous, current, now = Date.now()) {
  const old = previous?.records || {};
  const fresh = current?.records || {};
  const changes = [];
  for (const [key, entry] of Object.entries(fresh)) {
    if (!old[key]) {
      changes.push({ type: "new", source: entry.source, slug: entry.slug, code: entry.code, detail: "Новое предложение или промокод" });
    } else if (old[key].fingerprint !== entry.fingerprint) {
      changes.push({ type: "changed", source: entry.source, slug: entry.slug, code: entry.code,
        detail: old[key].erid !== entry.erid || old[key].domain !== entry.domain
          ? "Изменилась партнёрская ссылка / ERID" : "Изменились условия, ссылка или срок действия" });
    }
  }
  for (const [key, entry] of Object.entries(old)) {
    if (fresh[key] || !isCouponActive(entry.expires || null, now)) continue;
    changes.push({ type: "removed", source: entry.source, slug: entry.slug, code: entry.code, kind: entry.kind, identity: entry.kind === "deal" ? entry.key.split("|").at(-1) : entry.code, detail: "Активное по сроку предложение исчезло из источника" });
  }
  return changes.slice(0, 200);
}


/**
 * Reject obviously incomplete remote data rather than announcing that hundreds
 * of still-valid offers disappeared. Check only still-active previous offers:
 * planned expirations are not "source loss". Manual entries are versioned.
 */
export function checkSourceCompleteness(previous, current, source, now = Date.now()) {
  if (source === "manual") return { ok: true };
  const old = Object.values(previous?.records || {}).filter((r) =>
    isCouponActive(r.expires || null, now));
  const currentRecords = current?.records || {};
  const freshCount = Object.keys(currentRecords).length;
  const lostCount = old.filter((r) => !currentRecords[r.key]).length;
  if (old.length >= 10 && lostCount >= Math.max(8, Math.ceil(old.length * 0.5))) {
    return {
      ok: false,
      detail: "Резкое сокращение " + source + ": исчезли " + lostCount +
        " из " + old.length + " ещё действующих предложений. Предыдущий успешный снимок сохранён.",
      previousActive: old.length, lost: lostCount, current: freshCount,
    };
  }
  if (old.length && freshCount === 0) {
    return {
      ok: false,
      detail: "Пустой ответ " + source + " при " + old.length +
        " ранее действующих предложениях. Предыдущий снимок сохранён.",
      previousActive: old.length, lost: lostCount, current: 0,
    };
  }
  return { ok: true };
}

/**
 * Reconcile source-specific removals against the entire current inventory.
 * An offer that is still available under another source is a transfer, not
 * a disappearance. Do not suppress removals when the other source failed.
 */
export function reconcileCrossSourceChanges(changes, sourceStates, healthySources) {
  const indexes = new Map();
  for (const source of healthySources) {
    const records = sourceStates[source]?.records || {};
    for (const record of Object.values(records)) {
      const identity = [record.slug, record.kind, record.code || record.key.split("|").at(-1)].join("|");
      if (!indexes.has(identity)) indexes.set(identity, new Set());
      indexes.get(identity).add(source);
    }
  }
  return changes.map((change) => {
    if (change.type !== "removed") return change;
    const identity = [change.slug, change.kind, change.code || change.identity].join("|");
    const found = [...(indexes.get(identity) || [])].filter((source) => source !== change.source);
    return found.length
      ? { ...change, type: "transferred", detail: "Предложение отсутствует в прежнем источнике, но найдено в " + found.join(", ") }
      : change;
  });
}
