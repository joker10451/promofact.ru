import assert from "node:assert/strict";
import {
  BATCH_VERIFIED_CAMPAIGNS,getBatchCampaignAllowlist,getEffectiveCampaignAllowlist,
  checkBefreePilot
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
  assert.deepEqual(Object.keys(BATCH_VERIFIED_CAMPAIGNS).sort(),["14647","22484","28532"]);
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
  for(const invalid of ["","28532,","28532,999999","28532,28532","28532;14647","28532,unknown","28532,,14647","0","28532, 14647, #comment"]) {
    process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS=invalid;
    assert.deepEqual(getBatchCampaignAllowlist(),[],invalid);
    assert.equal(checkBefreePilot({...valid,couponId:"943201"}).passed,false,invalid);
  }
  process.env.ADMITAD_BATCH_APPROVED_CAMPAIGNS="28532,14647,22484";
  process.env.ADMITAD_APPROVED_CAMPAIGNS="";
  assert.deepEqual(getEffectiveCampaignAllowlist(),[],"Base allowlist is mandatory");
  console.log("Batch campaign register and strict Befree transition PASS");
} finally {
  restore("ADMITAD_APPROVED_CAMPAIGNS",before.base);
  restore("ADMITAD_TASTY_PILOT_ENABLED",before.tasty);
  restore("ADMITAD_BEFREE_PILOT_ENABLED",before.befree);
  restore("ADMITAD_BATCH_APPROVED_CAMPAIGNS",before.batch);
}
