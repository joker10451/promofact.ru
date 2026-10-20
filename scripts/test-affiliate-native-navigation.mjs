import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync("src/components/CouponTicket.tsx", "utf8");
const begin = source.indexOf("const prepareNativeAffiliateLink =");
const end = source.indexOf("const discountSizeClass =", begin);
assert.ok(begin > 0 && end > begin, "Native affiliate CTA handler must exist");
const handlers = source.slice(begin, end);
assert.match(handlers, /anchor\.href = withTeleportPilot\(classicUrl, clickId\)/);
assert.match(handlers, /decorateAdmitadUrl\(targetUrl/);
assert.match(handlers, /prepareNativeAffiliateLink\(e\.currentTarget\)/);
assert.doesNotMatch(handlers, /window\.open\(/, "No popup navigation");
const expiredGuard = /if \(!isCouponActive\(promocode\.expires\)\) \{\s*e\.preventDefault\(\);\s*setExpiredAttempt\(true\);\s*return;\s*\}/g;
const blocks = [...handlers.matchAll(expiredGuard)];
assert.equal(blocks.length, 2,
  "Only expired coupons may cancel the direct and copy-and-open anchor");
assert.doesNotMatch(handlers.replace(expiredGuard, ""), /e\.preventDefault\(/,
  "Valid affiliate links must remain native browser navigation");
assert.match(source, /href=\{outgoingUrl\}[\s\S]*?copyAndOpen\(e, promocode\.code\)/);
assert.match(source, /rel="noopener sponsored nofollow"/);
assert.match(source, /ymReachGoal\("copy_and_open", getAnalyticsContext\(\)\)/);
assert.match(source, /handleAffiliateClick\(\)/);
console.log("PASS: Native partner navigation, ERID/SubID decoration, click goals, modal copy-and-open");
