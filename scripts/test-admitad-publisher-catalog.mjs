import assert from "node:assert/strict";
import {verifiedPublisherWebsite,resolvePublisherStore,validPublisherAffiliateLink,baselineStillEligible,isReviewedMissingWebsiteCoupon} from "../src/lib/admitadPublisherCatalog.ts";
import {evaluateQualityGate} from "../src/lib/admitadApi.ts";
import {isAdmitadPublishable} from "../src/lib/admitadAutopilot.ts";
const site={id:2990501,name:"ПромоФакт",status:"active",site_url:"https://promofact.ru/"};
assert.equal(verifiedPublisherWebsite(site),true);
for(const bad of [
 {...site,status:"pending"},
 {...site,site_url:"http://promofact.ru/"},
 {...site,site_url:"https://promofact.ru.attacker.invalid/"},
 {...site,site_url:"https://evil@promofact.ru/"},
 {...site,site_url:"https://promofact.ru:441/"},
 {...site,id:0},
]) assert.equal(verifiedPublisherWebsite(bad),false);
const unmapped={strategy:"UNMAPPED",canonicalSlug:"",storeName:"Unknown",confidence:"none"};
const program={id:23573,name:"Davines",site_url:"https://davines.ru/",status:"active",connection_status:"active",action_countries:["RU"],advertiser_legal_info:"ООО «ГААП Холдинг»"};
assert.equal(resolvePublisherStore(program,unmapped).canonicalSlug,"davines");
assert.equal(resolvePublisherStore({...program,site_url:"https://davines.ru.evil.invalid"},unmapped).strategy,"UNMAPPED");
assert.equal(resolvePublisherStore({...program,site_url:"http://davines.ru/"},unmapped).strategy,"UNMAPPED");
assert.equal(resolvePublisherStore({id:723456,name:"Generic Store",site_url:"https://generic-shop.ru/"},unmapped).canonicalSlug,"admitad-723456-generic-shop");
assert.equal(resolvePublisherStore({id:723457,name:"Bad Host",site_url:"https://localhost/"},unmapped).strategy,"UNMAPPED");
const erid="MvGzQC98w3Z1gMq1pRuwzK7B";
const url="https://bywiola.com/g/mock/?i=31&erid="+erid;
assert.equal(validPublisherAffiliateLink(url,erid),true);
assert.equal(validPublisherAffiliateLink("http://bywiola.com/g/mock/?erid="+erid,erid),false);
assert.equal(validPublisherAffiliateLink(url,"NOT_THE_ERID"),false);
assert.equal(validPublisherAffiliateLink("https://bywiola.com/g/mock/?i=31",erid),false);
const coupon={id:934536,campaign:{id:23573,name:"Davines"},status:"active",is_personal:true,regions:["RU"],goto_link:url};
assert.equal(evaluateQualityGate(coupon,program).passed,false);
assert.equal(evaluateQualityGate(coupon,program,{verifiedPublisherScope:true}).passed,true);
const ctx={campaign:program,mapping:resolvePublisherStore(program,unmapped),qualityGatePassed:true,eridStatus:"PRESENT",eridValue:erid,legalInfoStatus:"PRESENT",advertiserLegalInfo:program.advertiser_legal_info,allowlist:["23573"]};
const candidate={is_personal:true,affiliateLink:url,isExpired:false,isForeign:false};
assert.equal(isAdmitadPublishable(candidate,ctx).publishable,false);
assert.equal(isAdmitadPublishable(candidate,{...ctx,verifiedPublisherScope:true}).publishable,true);
assert.equal(isAdmitadPublishable(candidate,{...ctx,verifiedPublisherScope:true,allowlist:[]}).publishable,false);
assert.equal(isAdmitadPublishable(candidate,{...ctx,verifiedPublisherScope:true,campaign:{...program,connection_status:"pending"}}).publishable,false);
console.log("Publisher-scoped Admitad coupon: correct website, Davines, geo, personal grant, ERID and permission checks PASS");

// Expired offer from old snapshot must not block new publisher catalog.
const now=Date.parse("2026-10-14T12:00:00Z");
assert.equal(baselineStillEligible("2026-10-13",now),false);
assert.equal(baselineStillEligible("2026-10-14",now),true);
assert.equal(baselineStillEligible("2026-10-15",now),true);
assert.equal(baselineStillEligible(null,now),true);
assert.equal(baselineStillEligible("not-a-date",now),true);
const reviewedBase={ id:"adm_901876",source_coupon_id:"901876",
 source_campaign_id:"25224",expires:"2026-10-31",
 last_seen_at:"2026-10-16T00:39:46.867Z" };
for (const couponId of ["901876","939051","940388"]) {
 assert.equal(isReviewedMissingWebsiteCoupon({
   ...reviewedBase,id:"adm_"+couponId,source_coupon_id:couponId
 }),true,"Exactly reviewed publisher Yandex Travel IDs");
}
for (const change of [
 {source_coupon_id:"901875",id:"adm_901875"},
 {source_campaign_id:"45863"},
 {expires:"2026-11-01"},
 {expires:null},
 {last_seen_at:"2026-10-19T00:00:00Z"},
 {id:"adm_999999"},
]) assert.equal(isReviewedMissingWebsiteCoupon({...reviewedBase,...change}),false);
const workerSource=(await import("node:fs")).readFileSync("src/lib/admitadSyncWorker.ts","utf8");
assert.match(workerSource,/CONFIRMED_WITHDRAWN_404/);
assert.match(workerSource,/REJECTED_DURING_VALIDATION/);
assert.match(workerSource,/protectedMissingCount/);
assert.match(workerSource,/if \(options.requireActiveRetention && protectedMissingCount > 0\)/);
console.log("Publisher retirement: exact 3 coupon IDs, 404 evidence and global retention protection PASS");
console.log("Publisher-scope retention: expired records can drop, unexpired and undated records protected PASS");
