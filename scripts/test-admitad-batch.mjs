import assert from "node:assert/strict";
import {
  BATCH_VERIFIED_CAMPAIGNS,getBatchCampaignAllowlist,getEffectiveCampaignAllowlist,
  isVerifiedBatchCampaignOrigin,
  checkBefreePilot, parseReviewedFiveCouponIds, isFiveCouponExplicitlyReviewed, FIVE_NEW_CAMPAIGN_IDS
} from "../src/lib/admitadAutopilot.ts";

const before={
  base:process.env.ADMITAD_APPROVED_CAMPAIGNS,
  tasty:process.env.ADMITAD_TASTY_PILOT_ENABLED,
  befree:process.env.ADMITAD_BEFREE_PILOT_ENABLED,
  batch:process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS
};
const restore=(key,val)=>val===undefined?delete process.env[key]:process.env[key]=val;
try {
  const valid={
    campaignId:"28532",couponId:"942686",promocode:"BEFREE-SAMPLE",
    erid:"BefreeValidCouponErid2026",
    affiliateLink:"https://bednari.com/g/abcdef/?i=31&erid=BefreeValidCouponErid2026"
  };
  assert.deepEqual(Object.keys(BATCH_VERIFIED_CAMPAIGNS).sort(),["11738","14647","14725","22484","23485","26032","28532","93978"]);
  assert.equal(isVerifiedBatchCampaignOrigin("28532","https://befree.ru/"),true);
  assert.equal(isVerifiedBatchCampaignOrigin("14647","https://www.sportmaster.ru/"),true);
  assert.equal(isVerifiedBatchCampaignOrigin("22484","https://randewoo.ru/"),true);
  assert.equal(isVerifiedBatchCampaignOrigin("93978","https://beeline.ru/shop/"),true);
  assert.equal(isVerifiedBatchCampaignOrigin("11738","https://foxford.ru/"),true);
  assert.equal(isVerifiedBatchCampaignOrigin("26032","https://aravia.ru"),true);
  assert.equal(isVerifiedBatchCampaignOrigin("14725","https://loverepublic.ru/"),true);
  assert.equal(isVerifiedBatchCampaignOrigin("23485","https://skysmart.ru/"),true);
  for(const bad of ["https://fakebefree.ru/","https://befree.ru.attacker.org/","http://befree.ru/","https://u:p@befree.ru/"]) {
    assert.equal(isVerifiedBatchCampaignOrigin("28532",bad),false,bad);
  }
  process.env.ADMITAD_APPROVED_CAMPAIGNS="141770,1667,17220,25224,26110";
  process.env.ADMITAD_TASTY_PILOT_ENABLED="false";
  process.env.ADMITAD_BEFREE_PILOT_ENABLED="false";
  delete process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS;
  assert.deepEqual(getBatchCampaignAllowlist(),[]);
  assert.deepEqual(getEffectiveCampaignAllowlist(),["141770","1667","17220","25224","26110"]);
  assert.equal(checkBefreePilot({...valid,couponId:"943201"}).passed,false);
  process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS="28532,14647,22484";
  assert.deepEqual(getBatchCampaignAllowlist(),["28532","14647","22484"]);
  assert.deepEqual(getEffectiveCampaignAllowlist(),["141770","1667","17220","25224","26110","28532","14647","22484"]);
  assert.equal(checkBefreePilot({...valid,couponId:"943201"}).passed,true);
  process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS="28532,14647,22484,93978,11738,26032,14725,23485";
  assert.equal(getBatchCampaignAllowlist().length,8);
  assert.equal(getEffectiveCampaignAllowlist().length,13);
  // Old 3-program cron remains valid and cannot accidentally publish new brands.
  process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS="28532,14647,22484";
  for(const invalid of ["","28532,","28532,999999","28532,28532","28532;14647","28532,unknown","28532,,14647","0","28532, 14647, #comment"]) {
    process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS=invalid;
    assert.deepEqual(getBatchCampaignAllowlist(),[],invalid);
    assert.equal(checkBefreePilot({...valid,couponId:"943201"}).passed,false,invalid);
  }
  process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS="28532,14647,22484";
  process.env.ADMITAD_APPROVED_CAMPAIGNS="";
  assert.deepEqual(getEffectiveCampaignAllowlist(),[],"Base allowlist is mandatory");

  assert.deepEqual(parseReviewedFiveCouponIds(""),[]);
  assert.deepEqual(parseReviewedFiveCouponIds("938019,896269,942802,938092,943834"),
    ["938019","896269","942802","938092","943834"]);
  assert.equal(FIVE_NEW_CAMPAIGN_IDS.length,5);
  assert.equal(isFiveCouponExplicitlyReviewed("11738","938019",["938019"]),true);
  assert.equal(isFiveCouponExplicitlyReviewed("26032","938019",["938019"]),false);
  assert.equal(isFiveCouponExplicitlyReviewed("14725","938019",["938019"]),false);
  for(const ids of ["938019,938019","938019,unknown","942123","938019,","938019;942802"]) {
    assert.throws(()=>parseReviewedFiveCouponIds(ids),/FIVE_COUPON_IDS_NOT_REVIEWED/,ids);
  }
  const fs=(await import("node:fs")).default;
  const worker=fs.readFileSync("src/lib/admitadSyncWorker.ts","utf8");
  assert.equal((worker.match(/if \(!options\.skipDbWrite\) await recordAdmitadSyncFailure\(/g)||[]).length,5,
    "All five preview failure paths must be DB read-only");
  assert.equal((worker.match(/if \(!options\.skipDbWrite\) await updateAdmitadSyncDiagnostics\(/g)||[]).length,1,
    "Successful preview must not change authoritative sync diagnostics");
  assert.match(worker,/newFiveOfferNotReviewed/);
  assert.match(worker,/options\.reviewedFiveCouponIds \?\? \[\]/,
    "Default sync without an explicit review must block new five-program coupon IDs");
  assert.doesNotMatch(worker,/options\.reviewedFiveCouponIds &&/,
    "Never guard coupon-level approval behind the presence of an optional argument");
  assert.match(worker,/!newOfferBlocked/);
  assert.match(worker,/duplicates_vs_perfluence: null/,
    "Don't report fabricated 0 duplicates without querying Perfluence");
  // Snapshot check (not a claim about the live Perfluence widget):
  // do not release coupon IDs if today's bundled partner feed contains
  // the same code for the same merchant. Cross-merchant matches are irrelevant.
  const feed=JSON.parse(fs.readFileSync("src/data/perfluence-feed.json","utf8"));
  const candidateBrandCodes=[
    {brand:"фоксфорд",codes:["REP50","FOXFORD5"]},
    {brand:"foxford",codes:["REP50","FOXFORD5"]},
    {brand:"aravia",codes:["НОЧЬ"]},
    {brand:"skysmart",codes:["СМОГУ"]},
    {brand:"билайн",codes:["ХАЛВА"]},
    {brand:"beeline",codes:["ХАЛВА"]}
  ];
  const duplicateCandidates=[];
  for(const entry of feed.data||[]) {
    const brand=String(entry.project?.name||"").trim().toLocaleLowerCase("ru-RU");
    const matching=candidateBrandCodes.filter(x=>brand.includes(x.brand));
    if(!matching.length)continue;
    for(const group of entry.groups||[]) {
      for(const promo of [...(group.promocodes||[]),...(group.widget_subscriber_codes||[])]) {
        const code=String(promo.code||"").trim().toLocaleUpperCase("ru-RU");
        if(matching.some(x=>x.codes.includes(code)))duplicateCandidates.push({brand,code});
      }
    }
  }
  assert.deepEqual(duplicateCandidates,[],
    "Perfluence bundled feed has same-merchant matching codes: review before Admitad launch");
  console.log("Bundled Perfluence exact-code collision check PASS (not a live duplicate audit)");
  console.log("Five-program coupon approval and DB read-only preview PASS");
  console.log("Batch campaign register and strict Befree transition PASS");
} finally {
  restore("ADMITAD_APPROVED_CAMPAIGNS",before.base);
  restore("ADMITAD_TASTY_PILOT_ENABLED",before.tasty);
  restore("ADMITAD_BEFREE_PILOT_ENABLED",before.befree);
  restore("ADMITAD_BATCH_APPROVED_CAMPAIGNS",before.batch);
}
