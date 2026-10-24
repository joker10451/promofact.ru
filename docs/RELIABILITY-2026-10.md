# Reliability rollout

## Execution plan and acceptance criteria

1. Reliability (this patch): verify inbound service authorization, preserve hard posting filters, accurately report IndexNow acceptance, remove stale-artifact/Windows-only test failures. Acceptance: lint, build, full regression suite and real-handler IndexNow tests pass.
2. Activate persistent delivery after staging reservation/RLS tests and database migration; configure VK callback and workflow secrets, deploy reviewed commit, verify read-only production endpoints. Do not exercise live send endpoints just to test a deploy.
3. Product experiment: select 5–10 landing pages from actual GSC demand, record a 28-day baseline, measure offer views, affiliate clicks and approved commissions separately. Existing financial panel is the reporting foundation. GSC subscription currently prevents live baseline retrieval.
4. Consolidate campaign data: replace date-named modules incrementally with source/placement/expiry/last-confirmed records. Start with one advertiser and preserve approved URL/ERID/audience pairs through regression tests.
5. Product quality: remove empty seasonal promotion claims in the deployed version, expose factual source-refresh dates, then trial opt-in store-specific alerts only after the funnel baseline exists.

Release branch rebased onto production commit `311bbe2` (56 commits ahead of the original local baseline), preserving current publisher placements. SeasonalSaleBanner now defaults to zero counts, labels empty collections as preparation and removes unsupported 90% claims. CLI upload excludes env files, session files and local audit data.

## Completed locally

- VK callback validates `VK_CALLBACK_SECRET` and `VK_GROUP_ID` before processing any event, including confirmation. Missing configuration returns 503. Set `VK_CONFIRMATION_CODE` explicitly.
- IndexNow requires `INDEXNOW_SECRET` or `CRON_SECRET`, validates exact HTTPS hostname, limits batches and reports actual upstream HTTP acceptance. Daily workflow forwards the same secrets. A successful response means submission acceptance, not indexing.
- Generic posting never falls back past expiry, hitOnly or recent-code filters. ISO timestamps and Moscow date-only expiry share the catalog parser.
- SEO regression calls the real sitemap generator rather than comparing a live catalog with a stale `.next` artifact.

## Persistent delivery ledger — schema deployed, application not enabled

Migration `20261024200813_posting_delivery_ledger` is applied to the verified `promofact` project (`vdfkouxsvnbjjsndrqcb`). Transactional checks of initial reservation, duplicate rejection, sent cooldown and 15-day release passed with rollback. Confirmed RLS enabled, no public SELECT/UPDATE/EXECUTE, service_role RPC access, and SECURITY INVOKER. The table contains zero rows. The advisor reports INFO for RLS with no policies, intentional for this service-role-only table.

Vercel team access restored. Production metadata confirms the server-only Supabase service-role key and CRON_SECRET exist (values not read). POSTING_LEDGER_ENABLED=true is configured for the next production deployment. VK callback settings are absent: webhook remains fail-closed until the same callback secret is configured in Vercel and the community settings.

The reservation RPC and table are service-role only; RLS blocks public access. One atomic reservation per channel/store/code prevents parallel deliveries. A successful delivery is eligible again after 14 days. Failed or ambiguous sends remain pending for manual review: automatically retrying a network timeout can duplicate a real message. Check provider history before releasing such reservations.

The ledger complements the existing selection history: file-based category/store rotation remains a heuristic, not a global guarantee. Only the generic Telegram/VK posting endpoints are wrapped; standalone publishing scripts need separate migration before claiming complete idempotency.

Two concurrent service_role reservations were executed against the applied RPC: exactly one true and one false. The single synthetic row was deleted after verification. No separate staging branch exists. Database migration is applied; no channel publication was performed. HTTP credential validity must be checked separately from metadata presence; no claim of live channel delivery is made.
