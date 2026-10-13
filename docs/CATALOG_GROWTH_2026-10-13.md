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

## Targeted origin review — Megafon, Korston, Globus (13 Oct 2026)

The following were checked against live **read-only** Supabase aggregates,
not the current advertiser-connection/placement permission screen:

| Campaign | Site in Admitad rows | Rows | End date not past | No end date | HTTPS+matching link ERID | Distinct raw code values |
| --- | --- | ---: | ---: | ---: | ---: | ---: |
| 2402 — МегаФон | https://shop.megafon.ru/ | 30 | 25 | 5 | 30 | 2 |
| 19773 — Korston | https://korston.ru/ | 23 | 20 | 3 | 23 | 2 |
| 19328 — Globus RU | https://www.globus.ru/ | 13 | 11 | 2 | 13 | 11 |

Official domain identity was independently corroborated with each public
merchant presence. The registered campaign's **current live API site_url** must
still match that exact origin, and the actual site-scoped publisher
connection/placement rights must be verified in Admitad.

**Warning:** 66 offers are NOT 66 independent verified promocodes. In the
stored feed 53 rows from Megafon/Korston share only four distinct raw code
values in aggregate; some may represent no-code deals or placeholders. Do not
publish repeated code values as unique coupons or treat an unstated expiry as
perpetual validity. Read-only SQL confirms matching ERID in stored affiliate
links, not that a click or purchase was successfully attributed.

A strictly read-only candidate-origin module
`scripts/catalog-growth-priority.mjs` now summarizes these three programs in
the general API audit. **It does not modify** `EXPLICIT_STORE_MAPPINGS`,
`STABLE_STORES`, the Supabase database, advertiser allowlists or the list of
published coupons. `publishable_now` stays zero until individual approval.

Before implementing store mappings and requesting publication, obtain the
program connection status, coupon-channel permissions, current code conditions,
live Perfluence collision check and then reviewed coupon-ID approval. Keep the
baseline 29 active Admitad records unaffected.
