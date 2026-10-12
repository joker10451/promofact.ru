import assert from "node:assert/strict";
import fs from "node:fs";
import {
  getTeleportVisitorIp,
  isTeleportPilotCoupon,
  isVerifiedTastyAffiliateLink,
  makeTeleportUrl,
  parseTeleportDestination,
  makeTeleportPilotPath,
} from "../src/lib/admitadTeleport.ts";

const affiliate = "https://dkfrh.com/g/va69o33134c7dde8999c9ebcee8c5e/?i=31&erid=2bL9aMPo2e49hMef4rrUCgKjJQ&subid=store_coupon&subid4=tracking-abc";
const erid = "2bL9aMPo2e49hMef4rrUCgKjJQ";
assert.equal(isVerifiedTastyAffiliateLink(affiliate, erid), true);
assert.equal(isVerifiedTastyAffiliateLink(affiliate, "other-token-longer"), false);
assert.equal(isVerifiedTastyAffiliateLink(affiliate.replace("dkfrh.com", "dkfrh.com.evil.example"), erid), false);
assert.equal(isVerifiedTastyAffiliateLink(affiliate.replace("/g/", "/tptv2/"), erid), false);
assert.equal(isVerifiedTastyAffiliateLink(affiliate.replace("https:", "http:"), erid), false);
assert.equal(isVerifiedTastyAffiliateLink("https://bad:user@dkfrh.com/g/va69o33134c7dde8999c9ebcee8c5e/?i=31&erid=" + erid, erid), false);
assert.equal(isVerifiedTastyAffiliateLink("not-a-url", erid), false);

assert.equal(isTeleportPilotCoupon({store:{slug:"tasty-coffee"},promocode:{group:"admitad",code:"TKPRDM-UYVG1GJO"}}),true);
assert.equal(isTeleportPilotCoupon({store:{slug:"pizzasushiwok"},promocode:{group:"admitad",code:"TKPRDM-UYVG1GJO"}}),false);
assert.equal(isTeleportPilotCoupon({store:{slug:"tasty-coffee"},promocode:{group:"perfluence",code:"TKPRDM-UYVG1GJO"}}),false);

assert.equal(getTeleportVisitorIp("8.8.8.8"),"8.8.8.8");
for (const ip of ["127.0.0.1","10.2.3.4","172.20.10.4","192.168.1.1","169.254.1.1","203.0.113.11","8.8.8.8, 9.9.9.9","::1","bad-ip"]) {
  assert.equal(getTeleportVisitorIp(ip), null, `No Teleport for ${ip}`);
}
assert.equal(getTeleportVisitorIp(null),null);

const tpt = makeTeleportUrl(affiliate,{ip:"8.8.8.8",userAgent:"Mozilla/5.0 Test Pilot",referer:"https://promofact.ru",country:"RU"});
assert.ok(tpt);
const t = new URL(tpt);
assert.equal(t.pathname,"/tptv2/va69o33134c7dde8999c9ebcee8c5e/");
assert.equal(t.searchParams.get("erid"),erid);
assert.equal(t.searchParams.get("subid"),"store_coupon");
assert.equal(t.searchParams.get("subid4"),"tracking-abc");
assert.equal(t.searchParams.get("i"),"31");
assert.equal(t.searchParams.get("ip_addr"),"8.8.8.8");
assert.equal(t.searchParams.get("user_agent"),"Mozilla/5.0 Test Pilot");
assert.equal(t.searchParams.get("referer"),"https://promofact.ru");
assert.equal(t.searchParams.get("country_code"),"RU");
assert.equal(makeTeleportUrl(affiliate,{ip:"127.0.0.1",userAgent:"Mozilla/5.0 Test Pilot",referer:"https://promofact.ru"}),null);

assert.equal(parseTeleportDestination(["https://shop.tastycoffee.ru/coffee/?admitad_uid=abc"]),"https://shop.tastycoffee.ru/coffee/?admitad_uid=abc");
for(const payload of [
  ["http://shop.tastycoffee.ru"],["https://shop.tastycoffee.ru.evil.example"],
  ["https://evil.example"],["https://dkfrh.com/dummy"],["javascript:alert(1)"],
  ["https://user:pass@shop.tastycoffee.ru"],[],["https://shop.tastycoffee.ru","https://example.org"],
  {url:"https://shop.tastycoffee.ru"},null,
]) assert.equal(parseTeleportDestination(payload),null);

const route = makeTeleportPilotPath(231,"store_coupon","550e8400-e29b-41d4-a716-446655440000");
assert.match(route,/^\/go\/admitad\/231\?/);
assert.match(route,/click_id=550e8400/);

// Safety checks for privacy, route flags, and no client-provided external URL.
const source = fs.readFileSync("src/app/go/admitad/[couponId]/route.ts","utf8");
const ticket = fs.readFileSync("src/components/CouponTicket.tsx","utf8");
const privacy = fs.readFileSync("src/app/privacy/page.tsx","utf8");
const consent = fs.readFileSync("src/lib/cookieConsent.ts","utf8");
assert.match(source,/ADMITAD_TELEPORT_PILOT_ENABLED/);
assert.match(source,/promofact_teleport_consent/);
assert.match(source,/getCoupons\(\)/);
assert.match(source,/cache: "no-store"/);
assert.match(source,/redirect: "manual"/);
assert.match(source,/AbortSignal.timeout/);
assert.match(source,/getTeleportVisitorIp/);
assert.match(ticket,/NEXT_PUBLIC_ADMITAD_TELEPORT_PILOT_ENABLED/);
assert.match(ticket,/getConsent\(\)/);
assert.match(privacy,/IP-адрес посетителя/);
assert.match(consent,/document.cookie = "promofact_teleport_consent=yes/);
assert.doesNotMatch(source,/searchParams.get\("url"\)/);
console.log("✓ Admitad Teleport opt-in: safe request, coupon-only route, consent, fallback, ERID/SubID and malicious responses PASS");
