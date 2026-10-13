Admitad Publisher Website Coupon Catalog

This feature is OFF for all existing workflows. It uses ONLY GET /coupons/website/{id}/ on a verified active promofact.ru website, NOT the Admitad Store tokenized products/offer export.
Connected advertiser status, RU geo, active coupon, expiry, HTTPS affiliate link + matching ERID and legal details are required. New sites are mapped to stable campaign-scoped slugs; known Davines/other official domains are pinned. Personal codes are eligible ONLY if returned by the OAuth publisher website endpoint. Existing 29 active offers must be retained, and more than 500 new offers aborts before any writes.

Trigger GitHub Actions workflow Admitad Publisher Website Coupon Catalog in preview mode first. This produces aggregate results and does not mutate Supabase. After verifying those and the program eligibility, select publish and confirm: the existing staging/RPC pipeline writes a single atomic snapshot. No background schedule is enabled in this rollout.

Credential-like URL shown in chat is a product export capability URL, not coupon inventory. Never add it to code, public logs, variables or the frontend; rotate the export link if public exposure is a concern.

Known previously problematic campaign PREMIER (45863) is withheld until separately reviewed. Existing single-coupon pilot restrictions are superseded only for this explicitly opted-in website-scoped feed.
