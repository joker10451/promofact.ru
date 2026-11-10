import type { Coupon } from "@/lib/types";

/**
 * Advertisers whose ads must carry mandatory disclaimers (medicine, supplements,
 * banks, insurance, payments). For these the automatic "publish any verified
 * widget offer" rule does not apply: they keep the hand-reviewed placement rules.
 * Matching is by exact slug or whole slug segment, never by substring ("hotpot"
 * must not look like "otp").
 */
const MEDICAL_SLUGS = new Set(["sberzdorovie", "sberanalizy"]);
const REGULATED_SLUGS = new Set([
  ...MEDICAL_SLUGS,
  "polzaru", "admitad-185231-maksavit",
  "sberbank", "vklad-v-sbere", "debetovaya-sberkarta", "kreditnaya-sberkarta", "detskaya-sberkarta",
  "ulybatl-oplata-ulybkoy", "t-bank-junior", "admitad-188182-tbank", "otp-bank",
  "rosgosstrakh", "platipomiru", "plati-po-miru",
]);
const REGULATED_SEGMENTS = new Set([
  "bank", "banka", "strakh", "strahovanie", "kredit", "credit", "zaim", "apteka", "apteki", "telemed", "analizy",
]);

function norm(slug: string): string {
  return slug.trim().toLowerCase();
}

export function isRegulatedAdvertiser(slug: string): boolean {
  const s = norm(slug);
  return REGULATED_SLUGS.has(s) || s.split("-").some((part) => REGULATED_SEGMENTS.has(part));
}

export function isMedicalAdvertiser(slug: string): boolean {
  const s = norm(slug);
  return MEDICAL_SLUGS.has(s) || s.split("-").some((part) => part === "telemed" || part === "apteka" || part === "apteki");
}

/** Wording the partner supplies with medical ads: "ИМЕЮТСЯ ПРОТИВОПОКАЗАНИЯ, НЕОБХОДИМА КОНСУЛЬТАЦИЯ СПЕЦИАЛИСТА". */
export function hasMedicalWarning(ordText: string | undefined | null): boolean {
  return /противопоказан/i.test(ordText ?? "");
}

/**
 * A medical offer without the warning in its advertising text is never shown,
 * whichever source or approval path produced it. Other categories pass.
 */
export function meetsMandatoryDisclaimers(c: Pick<Coupon, "store" | "affiliate">): boolean {
  if (!isMedicalAdvertiser(c.store.slug)) return true;
  return hasMedicalWarning(c.affiliate.ordText);
}
