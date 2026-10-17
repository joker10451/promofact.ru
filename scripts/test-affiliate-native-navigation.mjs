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
assert.doesNotMatch(handlers, /e\.preventDefault\(|window\.open\(/);
assert.match(source, /href=\{outgoingUrl\}[\s\S]*?copyAndOpen\(e, promocode\.code\)/);
assert.match(source, /rel="noopener sponsored nofollow"/);
assert.match(source, /ymReachGoal\("copy_and_open", getAnalyticsContext\(\)\)/);
assert.match(source, /handleAffiliateClick\(\)/);
console.log("PASS: Native partner navigation, ERID/SubID decoration, click goals, modal copy-and-open");
