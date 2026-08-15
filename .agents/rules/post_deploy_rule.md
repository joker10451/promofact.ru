---
trigger: always_on
description: Always verify Vercel deployment status after git push
---

# Post-Deployment Verification Rule

Whenever code is pushed to `origin/main`:
1. Always run `node scripts/verify-deploy.mjs` to ensure that Vercel has successfully built and deployed the changes.
2. Confirm that key store pages (`/store/litres`, `/store/tehnopark`, `/store/librederm`, `/store/plati-po-miru`) and core assets (`/manifest.webmanifest`, `/sitemap.xml`) return HTTP 200 OK without errors.
