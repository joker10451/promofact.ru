#!/usr/bin/env node
/**
 * Read-only discovery of the next batch of publisher-connected Admitad programs.
 * Run only on protected main with existing publisher API secrets.
 * Print aggregated eligibility and count information only.
 */
import {
  getAdmitadConfig,resolveWebsite,getConnectedPrograms,getWebsiteCoupons,
  evaluateQualityGate,evaluateLegalGate
} from "../src/lib/admitadApi.ts";
import {isRealPromoCode,normalizeCode} from "../src/lib/dedupe.ts";

const targets = [
  { id:25914,slug:"yandeks-praktikum",host:"practicum.yandex.ru" },
  { id:2402,slug:"megafon",host:"shop.megafon.ru" },
  { id:93978,slug:"internet-magazin-bilayn",host:"beeline.ru" },
  { id:11738,slug:"foxford",host:"foxford.ru" },
  { id:26032,slug:"aravia",host:"aravia.ru" },
  { id:14725,slug:"love-republic",host:"loverepublic.ru" },
  { id:23485,slug:"skysmart-ru",host:"skysmart.ru" },
  { id:131211,slug:"sunlight-ru",host:"sunlight.net" },
];

function exactHost(url,expected) {
  try {
    const parsed = new URL(url);
    return parsed.protocol==="https:" &&
      (parsed.hostname.toLowerCase()===expected || parsed.hostname.toLowerCase()==="www."+expected) &&
      !parsed.username && !parsed.password && !parsed.port;
  } catch {return false;}
}
function validDate(coupon,now) {
  const start=coupon.date_start ? new Date(coupon.date_start.slice(0,10)+"T00:00:00+03:00") : null;
  const end=coupon.date_end ? new Date(coupon.date_end.slice(0,10)+"T23:59:59+03:00") : null;
  return (!start || (Number.isFinite(start.getTime()) && start<=now)) &&
    (!end || (Number.isFinite(end.getTime()) && end>=now));
}
async function main() {
  const cfg = getAdmitadConfig();
  if (!cfg) throw new Error("CONFIG_MISSING");
  const site = await resolveWebsite(cfg);
  if (!site.website || site.website.status!=="active") throw new Error("PUBLISHER_SITE_NOT_ACTIVE");
  const [programs,coupons]=await Promise.all([
    getConnectedPrograms(String(site.website.id)),
    getWebsiteCoupons(String(site.website.id))
  ]);
  const byId=new Map(programs.map(p=>[Number(p.id),p]));
  const now=new Date();
  const data=targets.map(t=>{
    const p=byId.get(t.id);
    const offers=coupons.filter(c=>Number(c.campaign?.id)===t.id);
    const connected=!!p && p.status==="active" && p.connection_status==="active";
    const origin=!!p && exactHost(p.site_url||"",t.host);
    let eligible=0,qualityPassed=0,marked=0,expired=0,personal=0,codeCount=0,codeFree=0,duplicateRealCodes=0,invalidLinks=0,expiring7=0;
    const seen=new Set();
    for(const c of offers){
      const quality=evaluateQualityGate(c,p);
      const legal=evaluateLegalGate(c,p);
      const timeOk=validDate(c,now);
      const marker=legal.eridValue||"";
      const partnerUrl=c.goto_link||c.frameset_link||"";
      const linkOk=(()=>{
        try{
          const u=new URL(partnerUrl);
          return u.protocol==="https:" && !u.username && !u.password &&
            !!u.hostname && u.searchParams.get("erid")===marker;
        }catch{return false}
      })();
      const legalOk=legal.eridStatus==="PRESENT" && legal.legalInfoStatus==="PRESENT";
      const isPersonal=Boolean(c.is_personal||c.is_unique);
      if(quality.passed)qualityPassed++;
      if(legalOk)marked++;
      if(!timeOk)expired++;
      if(isPersonal)personal++;
      if(!linkOk)invalidLinks++;
      if(c.date_end){
        const date=new Date(c.date_end.slice(0,10)+"T23:59:59+03:00");
        if(date>=now && date.getTime()-now.getTime()<=7*86400000)expiring7++;
      }
      const code=normalizeCode(c.promocode||"");
      if(isRealPromoCode(code)){
        codeCount++;
        if(seen.has(code))duplicateRealCodes++;
        seen.add(code);
      }else codeFree++;
      if(connected && origin && quality.passed && legalOk && timeOk && !isPersonal && linkOk)eligible++;
    }
    return {
      campaign_id:t.id,slug:t.slug,publisher_connected:connected,official_site_match:origin,
      program_status:p?.status||"NOT_FOUND",connection_status:p?.connection_status||"NOT_FOUND",
      offers:offers.length,quality_pass:qualityPassed,erid_legal_present:marked,
      currently_eligible_for_review:eligible,codes:codeCount,code_free:codeFree,
      duplicates:duplicateRealCodes,invalid_links:invalidLinks,personal,not_current:expired,expires_next_7_days:expiring7,
      publication_authorized:false
    };
  });
  console.log("CATALOG_GROWTH_4_LIVE_AUDIT "+JSON.stringify({
    checked_at_utc:now.toISOString(),website_active:true,
    api_programs:programs.length,api_offers:coupons.length,
    results:data,write_count:0
  }));
}
main().catch(e=>{
  const safe=new Set(["CONFIG_MISSING","PUBLISHER_SITE_NOT_ACTIVE"]);
  console.error("CATALOG_GROWTH_4_LIVE_AUDIT_FAILED "+(safe.has(e?.message)?e.message:"NETWORK_OR_SCHEMA_ERROR"));
  process.exitCode=1;
});
