/**
 * Candidate STORE IDENTITY evidence for manual Admitad review. This is not the
 * active store mapper, coupon allowlist or publisher approval registry.
 * Only program ID + HTTPS official origin pairs verified against the
 * advertiser's public sites can be suggested for subsequent review.
 */
export const PRIORITY_CANDIDATES = Object.freeze([
  { campaign_id:"2402",brand:"МегаФон",proposed_slug:"megafon",hosts:["shop.megafon.ru"] },
  { campaign_id:"19773",brand:"Korston",proposed_slug:"korston",hosts:["korston.ru","www.korston.ru"] },
  { campaign_id:"19328",brand:"Globus RU",proposed_slug:"globus",hosts:["globus.ru","www.globus.ru"] },
]);

export function matchesOfficialOrigin(value,allowedHosts) {
  try {
    if (typeof value!=="string") return false;
    const parsed=new URL(value);
    return parsed.protocol==="https:" && !parsed.username && !parsed.password &&
      !parsed.port && allowedHosts.includes(parsed.hostname.toLowerCase());
  }catch{return false;}
}
function nonExpired(end, now) {
  if (typeof end!=="string"|| !/^\d{4}-\d{2}-\d{2}(?:$|[T ])/.test(end))return false;
  const date=Date.parse(end.slice(0,10)+"T23:59:59+03:00");
  return Number.isFinite(date)&&date>=+now;
}

/**
 * Aggregate counts only. No codes, coupon IDs, ERIDs, affiliate URLs, raw
 * advertiser strings or secrets in the output.
 */
export function prioritizePublicPrograms(programs,coupons,now=new Date()) {
  if(!Array.isArray(programs)||!Array.isArray(coupons)||!Number.isFinite(+now))throw Error("INVALID_PRIORITY_INPUT");
  return PRIORITY_CANDIDATES.map(target=>{
    const p=programs.find(program=>String(program.id)===target.campaign_id);
    const offers=coupons.filter(c=>String(c?.campaign?.id)===target.campaign_id);
    const distinctCodes=new Set(offers.map(c=>String(c.promocode||"").trim().toUpperCase()).filter(Boolean));
    const expirySet=offers.filter(c=>c.date_end!==null&&c.date_end!==undefined&&c.date_end!=="");
    const official_origin=p?matchesOfficialOrigin(p.site_url,target.hosts):false;
    return {
      campaign_id:target.campaign_id,
      brand:target.brand,
      proposed_store_slug:target.proposed_slug,
      publisher_connected:Boolean(p && p.status==="active" && p.connection_status==="active"),
      official_origin_match:official_origin,
      source_offers:offers.length,
      date_end_not_past:expirySet.filter(c=>nonExpired(c.date_end,now)).length,
      no_expiry_date:offers.length-expirySet.length,
      unique_raw_code_values:distinctCodes.size,
      mapping_approved:false,
      advertiser_coupon_placement_approved:false,
      individual_coupon_ids_reviewed:false,
      live_perfluence_dedup_done:false,
      publishable_now:0,
    };
  });
}
