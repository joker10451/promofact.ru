import assert from "node:assert/strict";
import fs from "node:fs";
import {
  VKUSVILL_OCT18_SITE_LINK,
  VKUSVILL_OCT18_ERID,
  VKUSVILL_OCT18_LEGAL,
  VKUSVILL_OCT18_VALID_CODES,
  VKUSVILL_OCT18_SITE_OFFERS,
  isApprovedOct18WebsitePlacement,
} from "../src/lib/perfluenceOct18Scheduled.ts";
import { getCustomCoupons } from "../src/lib/customCoupons.ts";
import { withoutForbiddenGroceryCoPromotion } from "../src/lib/publisherPlacementRules.ts";
import { isCouponActive } from "../src/lib/couponExpiry.ts";
import { getFlor2uTelegramOffers, FLOR2U_OCT18_TELEGRAM_LINK, FLOR2U_OCT18_TELEGRAM_ERID } from "../src/lib/perfluenceOct18Telegram.ts";
import { formatTelegramPost } from "../src/lib/telegram.ts";
import { dedupeCoupons } from "../src/lib/dedupe.ts";

// Publisher panel: VkusVill approved for promofact.ru, Flor2u for Telegram only.
assert.equal(new URL(VKUSVILL_OCT18_SITE_LINK).pathname, "/sites/ni6chn");
assert.equal(new URL(VKUSVILL_OCT18_SITE_LINK).searchParams.get("erid"), VKUSVILL_OCT18_ERID);
assert.ok(VKUSVILL_OCT18_LEGAL.includes("erid: " + VKUSVILL_OCT18_ERID));
assert.equal(VKUSVILL_OCT18_SITE_OFFERS.length, 5);
assert.equal(new Set(VKUSVILL_OCT18_SITE_OFFERS.map(c=>c.promocode.code)).size, 5);
assert.deepEqual(new Set(VKUSVILL_OCT18_VALID_CODES),new Set([
  "VSTCLCZ","30V8RX3X","VSYGG5G","VSDJR76","35VEM5EY"
]));
const expectedAmounts = new Map([
  ["VSTCLCZ", [600,3000]], ["30V8RX3X",[300,1500]],
  ["VSYGG5G",[250,1250]], ["VSDJR76",[200,1000]],
  ["35VEM5EY",[350,2500]],
]);
for(const c of VKUSVILL_OCT18_SITE_OFFERS){
  const [discount,minimum] = expectedAmounts.get(c.promocode.code);
  const numbers = [discount,minimum].map(v=>v.toLocaleString("ru-RU").replace(/\u00a0/g," "));
  assert.ok(c.promocode.bonusName.includes(numbers[0] + " ₽"), c.promocode.code);
  assert.ok(c.promocode.terms.includes("от " + numbers[1] + " ₽"), c.promocode.code);
  assert.equal(c.promocode.expires,"2026-10-31T23:59:59+03:00");
  assert.equal(c.promocode.isFirstOrderOnly,true);
  assert.equal(c.promocode.isUniversal,false);
  assert.equal(c.store.slug,"vkusvill-dostavka");
  assert.equal(c.promocode.group,"perfluence");
  assert.equal(c.affiliate.link,VKUSVILL_OCT18_SITE_LINK);
  assert.equal(c.affiliate.landingLink,VKUSVILL_OCT18_SITE_LINK);
  assert.equal(c.affiliate.ordMarker,VKUSVILL_OCT18_ERID);
  assert.equal(c.affiliate.ordText,VKUSVILL_OCT18_LEGAL);
  assert.equal(isApprovedOct18WebsitePlacement(c),true);
  assert.equal(isCouponActive(c.promocode.expires,Date.parse("2026-10-18T12:00:00+03:00")),true);
  assert.equal(isCouponActive(c.promocode.expires,Date.parse("2026-11-01T00:00:00+03:00")),false);
  assert.equal(isApprovedOct18WebsitePlacement({...c, affiliate:{...c.affiliate,link:"https://vksvl.prfl.me/smart_zakupka/old?erid=OLD"}}),false);
  assert.equal(isApprovedOct18WebsitePlacement({...c, affiliate:{...c.affiliate,ordMarker:"OLD"}}),false);
  assert.equal(isApprovedOct18WebsitePlacement({...c, promocode:{...c.promocode,code:"OLDPROMO"}}),false);
}
const custom = getCustomCoupons().filter(c=>c.store.slug==="vkusvill-dostavka");
assert.equal(custom.length,5);
const old = {...custom[0],id:80000,affiliate:{...custom[0].affiliate,link:"https://vksvl.prfl.me/smart_zakupka/old?erid=OLD"}};
const merged=dedupeCoupons([{source:"custom",coupons:custom},{source:"perfluence",coupons:[old]}]).coupons.filter(isApprovedOct18WebsitePlacement);
assert.equal(merged.length,5);
assert(merged.every(c=>c.affiliate.link===VKUSVILL_OCT18_SITE_LINK));

const flor2u={...custom[0],store:{...custom[0].store,slug:"flor2u",name:"Flor2u"},
  affiliate:{...custom[0].affiliate,link:"https://flor2u.prfl.me/smart_zakupka/c4kk2w?erid=2RanynYVgRh"}};
assert.equal(isApprovedOct18WebsitePlacement(flor2u),false,
  "Flor2u awaiting promofact.ru approval must not get a web placement");
const pyaterochka={...custom[0],store:{...custom[0].store,slug:"pyaterochka",name:"Пятёрочка"}};
assert.deepEqual(withoutForbiddenGroceryCoPromotion([custom[0],pyaterochka]).map(c=>c.store.slug),["pyaterochka"]);
assert.equal(withoutForbiddenGroceryCoPromotion([custom[0]]).length,1,
  "Standalone VkusVill page must remain independently published");

const source=fs.readFileSync("src/lib/perfluence.ts","utf8");
assert.ok(source.includes("filter(isApprovedOct18WebsitePlacement)"));
const home=fs.readFileSync("src/app/page.tsx","utf8");
const collections=fs.readFileSync("src/app/collections/[slug]/page.tsx","utf8");
assert.ok(home.includes("withoutForbiddenGroceryCoPromotion"));
assert.ok(collections.includes("withoutForbiddenGroceryCoPromotion"));
const article=fs.readFileSync("src/lib/articles.ts","utf8");
assert.ok(article.includes(VKUSVILL_OCT18_SITE_LINK));
assert.ok(article.includes("Все коды действуют до 31 октября 2026 года"));
assert.ok(!article.includes("vksvl.prfl.me/smart_zakupka/ekg3pn"));

const evening = Date.parse("2026-10-18T17:00:00+03:00");
const flor2uTelegram = getFlor2uTelegramOffers(evening);
assert.equal(flor2uTelegram.length,2);
assert.deepEqual(flor2uTelegram.map(c=>c.promocode.code),["JHD_H13J3H1","KRL_4G44HH5"]);
for (const c of flor2uTelegram) {
  assert.equal(c.affiliate.link,FLOR2U_OCT18_TELEGRAM_LINK);
  assert.equal(c.affiliate.ordMarker,FLOR2U_OCT18_TELEGRAM_ERID);
  assert.equal(c.store.slug,"flor2u");
  assert.equal(isApprovedOct18WebsitePlacement(c),false);
  const post = formatTelegramPost(c);
  assert.equal(post.buttons.length,1,"Unapproved website must not be linked from Telegram");
  assert.equal(post.buttons[0][0].url,FLOR2U_OCT18_TELEGRAM_LINK);
  assert.ok(post.text.includes("erid: "+FLOR2U_OCT18_TELEGRAM_ERID));
  assert.ok(post.text.includes(c.promocode.code));
}
assert.equal(flor2uTelegram[0].promocode.isFirstOrderOnly,true);
assert.equal(flor2uTelegram[1].promocode.isUniversal,true);
assert.deepEqual(getFlor2uTelegramOffers(Date.parse("2026-10-19T00:00:00+03:00")).map(c=>c.promocode.code),["KRL_4G44HH5"]);
assert.equal(getFlor2uTelegramOffers(Date.parse("2026-11-01T00:00:00+03:00")).length,0);
const telegramRoute = fs.readFileSync("src/app/api/telegram/post/route.ts","utf8");
assert.ok(telegramRoute.includes('storeSlug === "flor2u" ? getFlor2uTelegramOffers() : await getCoupons()'));
const tgSource=fs.readFileSync("src/lib/telegram.ts","utf8");
assert.ok(tgSource.includes('coupon.store.slug !== "flor2u"'));
console.log("PASS: VkusVill website approvals and anti-co-promotion; Flor2u Telegram-only attribution, flash expiry, safe CTA");

