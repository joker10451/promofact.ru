# PromoFact — Admitad five-program review (2026-10-12)

**STATE: HOLD / NO PUBLISH.** This document is a read-only review of the
2026-10-12 12:58 UTC production Supabase snapshot. No advertiser authorization
has been inferred from a coupon appearing in the publisher API.

## Current authoritative baseline

- Supabase project: `vdfkouxsvnbjjsndrqcb`; tables `admitad_coupons` and `admitad_sync_meta`.
- `last_status=SUCCESS`; `last_success_count=27`.
- 570 rows; statuses: 27 `PUBLISHABLE`, 63 `READY_NOT_APPROVED`,
  375 `UNMAPPED`, 90 `QUALITY_GATE_FAILED`,
  10 `CAMPAIGN_MODERATION`, 5 `UNAUTHORIZED_PROMOCODE`.
- The five target campaigns total **39 READY_NOT_APPROVED** rows:
  Foxford 11, Beeline 11, Aravia 10, Love Republic 4, Skysmart 3.
- Of these, only **5 candidate coupon IDs** were selected for *further human
  review*. The other 34 must stay on hold. **0 are newly authorized**.

## Candidate review queue (not permission to publish)

| Admitad campaign | Brand | Coupon ID | Code | Advertised condition | Expires |
| --- | --- | --- | --- | --- | --- |
| 11738 | Фоксфорд | 938019 | REP50 | 50% first purchase of 4/8/16 tutoring sessions | 2026-10-31 |
| 11738 | Фоксфорд | 896269 | FOXFORD5 | 5% first payment; feed says combines with promotions | 2026-12-31 |
| 26032 | Aravia | 942802 | НОЧЬ | 20%, exclusions including professional assortment, education and certificates | 2026-10-29 |
| 23485 | Skysmart | 938092 | СМОГУ | 50% on qualifying school-year tutoring offer; verify exact eligibility | 2026-10-15 |
| 93978 | Билайн | 943834 | ХАЛВА | 3,500 RUB off eligible goods; not stackable with trade-in | 2026-10-15 |

**Love Republic (14725): no approved candidates.** All four rows describe
code-free deals and have no expiry date; require freshness, scope and explicit
coupon-site permission review before even entering the candidate registry.

**Exclude examples:** some Foxford rows have conflicting discount numbers in
title versus description; some Aravia entries label cashback as a discount or
misstate delivery thresholds; older Beeline rows reference 2024 campaigns;
Skysmart `Новый каталог курсов` is not a saving; selected SUNLIGHT codes are
short-dated but belong to a different program and are NOT in this rollout;
PREMIER has special channel restrictions. Do not reinterpret fake placeholder
codes like `НЕ НУЖЕН` as real entered codes.

## Mandatory approval checklist

- [ ] Confirm, **in the connected Admitad advertiser/program account**, that
  promo-code/coupon aggregator placement is allowed for each campaign and that
  each specific coupon ID is authorized for PromoFact (not blogger-only,
  one-time, personally issued, exclusive to another channel or platform).
- [ ] Confirm connected program `active`, site `promofact.ru`, official
  site origin, RU geography, current discount terms and time window.
- [ ] Verify each code's current availability and advertiser-specific
  exclusions; never promise a successful checkout without testing.
- [ ] Verify HTTPS affiliate URL, matching live creative ERID, complete
  advertiser legal notice, and absence of redirects that strip attribution.
- [x] Check the bundled Perfluence snapshot (2026-10-12 10:27 UTC): 45 projects,
  79 promo codes. None of the five shortlisted codes appear under the
  corresponding advertiser. An exact-code collision test is now in CI.
- [ ] Compare the *current live* Perfluence inventory and Admitad candidates
  immediately before release. The bundled snapshot is not a live duplicate audit.
- [ ] Verify original 27 active coupon IDs and 8 campaign baseline counts are
  retained in the dry-run; ensure no stale/expired or extra offers are activated.
- [ ] Review deployment limit and CI; no Vercel deployment needed merely to
  review this branch.

## Safe live Admitad WHAT-IF preview

A manual GitHub Actions `Admitad Verified Program Batch Sync` run can be
launched against this branch with `mode=initial`, `batch=expand-five`,
`confirm=true` and `preview_only=true`. It uses the existing secrets to
fetch the **current, site-scoped Admitad API** and compares the five
shortlisted coupon IDs against the 27-row database baseline.

The read-only script deliberately *simulates* exact ID approvals for these
five candidates only to compute a proposed active count; this is **not**
publisher authorization. It aborts/returns **before staging, publishing or
sync diagnostics**, and logs `ADMITAD_FIVE_READ_ONLY_PREVIEW`,
`dbWrites:0` and `permissionsApproved:false`.
It does not make a current Perfluence API call; that remains a separate
requirement.

The normal `preview_only=false` path continues to require explicit
`ADMITAD_BATCH_REVIEWED_COUPON_IDS` for any five-brand publication.

## Release control

Existing `workflow_dispatch` `expand-five` is still **not** permission to
publish. The new code additionally requires GitHub Actions variable
`ADMITAD_BATCH_REVIEWED_COUPON_IDS` listing a nonempty subset of the five
exact IDs above, *after* manual account permission review. Missing or invalid
value aborts prior to write. ID matching is exact and coupon-specific, while
Love Republic remains held.

The mode `initial` preserves the 27-row baseline, uses the existing 40-row
cap and atomic-sync check, and now gates newly enabled offers by individual
coupon ID. The normal `existing-three` recurring route remains unchanged.
The `skipDbWrite:true` worker path is now truly read-only, including status/
failure diagnostics; do not run the separate auto-publishing workflow until
advertiser permissions have been confirmed.

**Safety follow-up (2026-10-12):** New five-program offers are now
blocked in **every** sync mode, including ordinary cron/API synchronization,
unless an exact coupon ID is explicitly reviewed. A campaign-wide environment
allowlist by itself does **not** approve any new coupon.

The previous diagnostic field `duplicates_vs_perfluence: 0` was a
hardcoded placeholder, not a measured zero. It is now `null` until a
live cross-network comparison is actually performed. Publisher-side
permission and a live Perfluence comparison are still pending.

**Review result:** 39 candidates discovered; 5 shortlisted; 34 excluded from
the shortlist; **0 new offers published**.
