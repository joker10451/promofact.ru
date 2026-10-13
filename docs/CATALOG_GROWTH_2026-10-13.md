# PromoFact catalog growth: 13 October 2026
Status: **REVIEW ONLY. No new offer authorized or published.**

## Verified current Admitad baseline
Live Supabase read-only count: **575 rows**.
- PUBLISHABLE and active: 29.
- READY_NOT_APPROVED: 63.
- UNMAPPED: 366.
- QUALITY_GATE_FAILED: 96.
- CAMPAIGN_MODERATION: 16.
- UNAUTHORIZED_PROMOCODE: 5.
Last successful snapshot at 2026-10-13 10:40:11 UTC, last_success_count=29.
These are Admitad numbers; other PromoFact feeds are not included.

## New all-program read-only audit
The existing live scripts inspect 3–8 named campaigns. Run the new
`npm run catalog:growth:audit` **only** with
`CATALOG_GROWTH_READ_ONLY=true` and approved publisher credentials,
or use manual GitHub Action **Admitad All-Program Discovery (Read Only)**.
It inspects ALL site-scoped connected programs and coupons, returning only
aggregate counts and top 25 program IDs with canonical slugs and hold reasons.
No raw codes, legal text, affiliate links, ERID values, private credentials,
individual coupon IDs or person data go to logs. No Supabase secrets or writes.

A campaign in an environment allowlist is NOT coupon-level approval.
Every report says publication_authorized=false and
approved_for_publication=0. The "technically_reviewable" count is only
a queue for human advertiser permission and freshness checks. Missing
expiry, personal/unique/exclusive codes, inactive connections, invalid
affiliate URLs or mismatched ERID, low-confidence store mappings and
duplicate codes are held from this queue.

## Next publisher actions (not automated here)
1. Audit high-volume UNMAPPED campaigns against the actual advertiser's
   official site; verify store match and approved coupon-placement channel.
2. Obtain coupon-ID-specific approval from the connected advertiser program.
   Do not assume API visibility conveys publication rights.
3. Validate deal terms, RU availability, creative's ERID, advertiser legal
   disclosures and attribution-preserving HTTPS links.
4. Perform a LIVE Perfluence cross-network collision audit immediately before
   any release. The bundled JSON is historical, not proof of no duplicates.
5. Only send reviewed individual offers through the existing safe dry-run,
   allowlist checks, catastrophic-drop guard and atomic publish. Preserve
   the existing 29 active offers. Never auto-enable all 575 rows.
6. Keep Vercel deploys consolidated; do not require a Vercel build merely
   to run this read-only inventory report.

The new audit has not been launched with live Admitad credentials by
this commit. An offline classifier unit test guards the fail-closed logic.
