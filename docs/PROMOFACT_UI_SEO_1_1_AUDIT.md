# PromoFact UI/SEO 1.1 — verified audit + single-release plan

**Prepared 2026-10-13. No production release from this branch.**

## Confirmed from the published production site

- Vercel production deployment `8b3448c7a62a80a7dbe3abeb1d398034c4f5222c` was `READY`.
- The homepage, Sber campaign landings, Tasty Coffee, Randewoo and Pyaterochka returned HTTP 200 when crawled.
- `robots.txt` and `sitemap.xml` returned HTTP 200; the GSC sitemap reported 0 warnings and 0 errors at that check.
- Supabase: 27 active Admitad records, 63 `READY_NOT_APPROVED` records, 570 total. All 27 active records had HTTPS affiliate links, nonempty ERID and legal text, no expired active offers, and distinct coupon IDs.
- Google's last settled 28-day reporting period showed 1,913 impressions and 20 clicks; 1,338 impressions were mobile (~69.9%). Search Console data lags production releases.
- Sber campaigns use **authentic advertiser creatives** on the full pages, not on the new compact homepage teaser area. The offers have hard expiry gates.

## Changes included in this batch

1. Readable advertising disclosures on compact Sber homepage teasers: at least 12px, stronger contrast, and wrapping for legal/ERID strings. Sponsor names/INN/ERID, original images, affiliate links and expiry dates are unchanged.
2. On store landing JSON-LD, prefer merchant URL (`store.site`), not the PromoFact coupon page, when the merchant URL is already known. Include `store.logo` when the existing catalogue actually supplies a logo; **never fabricate one**. Coupons/Offers preserve code/no-code logic.
3. Regression checks for exact seller-brand metadata, legal disclosure readability, and Playwright coverage of 360, 390, 768 and 1440px: horizontal overflow, sponsored CTA links and source ERID, campaign landing URLs. Existing coupon-copy/attribution E2E scenarios remain enabled.

## Additional continuity fixes (same branch, no deployment)

- Verified official websites: Askona at `https://www.askona.ru/`, POLZAru at `https://polza.ru/`.
- Production and Search Console identified legacy URLs `/store/askona` and `/store/polzaru` returning 404. No active offers for either merchant were found in the published Perfluence feed or the Supabase manual/Admitad tables. Both now have honest **brand-only stable fallback pages** that return 200 after release, link to the official merchant without an affiliate code, and remain **noindex** until a real active offer exists. This helps visitors but does not pretend to preserve search indexation.
- Store empty-state copy is corrected: no claims that unverified seasonal promotions are currently live. No change to existing live coupons.
- CI now keeps short-lived Playwright screenshots for 360/390/768/1440px and two legacy store pages as a PR artifact; this does not use Vercel deployment quota.
- E2E checks 200/noindex and lack of fabricated coupons for these restored URLs. Download screenshots from the successful CI run for visual review.

## Investigated, deliberately NOT 'fixed' without evidence

- `/store/yandex-eda` and `/store/iv-roshe` currently return HTML `noindex` because the store-page code hides pages that have **zero live coupons**. This is intentionally safer than re-indexing empty affiliate pages. Confirm valid offers before removing `noindex`.
- `/store/polzaru` and `/store/askona` previously returned 404; their exact-brand continuity pages are now in this PR. The fallback is strictly noindex when there are no genuine offers. No cross-brand redirects or fictitious coupons were introduced.
- `/store/megafon` returned 404 on direct check, and existing Admitad mapping is blocked; do not create an empty landing merely to remove the status.
- Some historic articles have no supplied publication date and/or image. Do not insert today's date or stock images as fake metadata; source-authored information must be checked first.
- The audit's `Organization missing logo` warnings can recur when the merchant has no genuine logo. This patch adds *existing* brand images only.
- Real checkout application of coupons was not tested. Never claim a coupon was redeemed.
- Mobile browser testing uses local Next.js Playwright fixtures in CI; it is **not** a visual inspection of remote production. Review screenshots before calling the mobile UI fully audited.
- Chrome UX Report is unconfigured and Vercel Web Analytics reports `web_analytics_not_enabled`; do not invent field performance or traffic.

## Screenshot-based mobile review (GitHub Actions run 38315882773)

The 6 real Playwright screenshots were downloaded and visually inspected for 360px,
390px, 768px and 1440px. The original CI fixtures are **not** production screenshots.

- The initial mobile capture contained excessive whitespace at the top of the
  homepage. Mobile-only hero padding, trust-bar spacing and popular-stores
  spacing have been tightened; desktop spacing remains unchanged.
- Numerous remote brand logos showed blank circles while third-party favicon
  images were loading. `StoreLogo` now renders an actual initial-letter
  gradient immediately, switching to the real image once loaded, including
  after a fast cache hit or failed remote request.
- For 360/390px, popular stores show the first 6 cards (2 rows); tablet and
  desktop keep 12 cards. The `/promokody` link still exposes the entire catalog.
- Follow-up CI screenshots now include **viewport-only** captures in addition
  to full-page images, because the first full-page output was 416px wide even
  when the browser viewport was 360/390px. The E2E no-horizontal-scroll check
  still passes; the extra full-page capture width alone is insufficient evidence
  of user-scrollable overflow. A human should check the viewport PNGs.
- The Askona and POLZAru screenshots showed honest empty-state copy, official
  outbound links, no coupon cards, and mobile bottom navigation.

Keep this PR as draft until new CI is green and follow-up screenshots reviewed.

## Release guard / cost control

- Work exclusively on `fix/promofact-ui-seo-1-1-batch`, open **one PR**, let GitHub Actions run once after final changes.
- Keep `vercel.json` `git.deploymentEnabled["*"] = false`: no automatic Preview deployments.
- No manual `create_deployment`, no release to `main`, no DB mutations while this PR is under review.
- When ready, merge **once** to `main`; permit **one** automatic production deployment. Verify `READY`, domain aliases and preservation of the 27 active offers.
- Leave any unrelated Admitad offer onboarding behind manual advertiser permission and legal review.

## Post-release checks

Visit homepage and the two campaign landings at desktop and mobile sizes, validate visible labels and ERID, verify the fallback for expired promotions, follow internal CTAs (not paid conversions), and inspect production for errors before starting more SEO work.
