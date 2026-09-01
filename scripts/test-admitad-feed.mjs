import https from "https";

const url =
  "https://export.admitad.com/ru/webmaster/websites/2990501/coupons/export/?code=jdskmibwva&user=ilia_pisklov6ed68&region=00&format=xml&v=1";

const options = {
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
    Accept: "application/xml,text/xml,*/*",
  },
};

https.get(url, options, (res) => {
  let xml = "";
  res.on("data", (chunk) => (xml += chunk));
  res.on("end", () => {
    // 1. Кампании
    const campaigns = new Map();
    const campRegex = /<advcampaign id="(\d+)">([\s\S]*?)<\/advcampaign>/g;
    let match;
    while ((match = campRegex.exec(xml)) !== null) {
      const id = match[1];
      const body = match[2];
      const name = (body.match(/<name>(.*?)<\/name>/) || [])[1] || "";
      const site = (body.match(/<site>(.*?)<\/site>/) || [])[1] || "";
      campaigns.set(id, { name, site });
    }

    // 2. Купоны
    const coupons = [];
    const coupRegex = /<coupon id="(\d+)">([\s\S]*?)<\/coupon>/g;
    while ((match = coupRegex.exec(xml)) !== null) {
      const id = parseInt(match[1], 10);
      const body = match[2];
      const name = (body.match(/<name>(.*?)<\/name>/) || [])[1] || "";
      const campId =
        (body.match(/<advcampaign_id>(.*?)<\/advcampaign_id>/) || [])[1] || "";
      const logo = (body.match(/<logo>(.*?)<\/logo>/) || [])[1] || "";
      const promocode =
        (body.match(/<promocode>(.*?)<\/promocode>/) || [])[1] || "";
      const gotolink =
        (body.match(/<gotolink>(.*?)<\/gotolink>/) || [])[1] || "";
      const dateEnd =
        (body.match(/<date_end>(.*?)<\/date_end>/) || [])[1] || "";
      const discount =
        (body.match(/<discount>(.*?)<\/discount>/) || [])[1] || "";
      const customerType =
        (body.match(/<customer_type>(.*?)<\/customer_type>/) || [])[1] || "";
      const camp = campaigns.get(campId) || { name: "Магазин", site: "" };

      coupons.push({
        id,
        name: name.replace(/&amp;/g, "&"),
        store: camp.name,
        promocode: promocode === "Not required" ? "" : promocode,
        gotolink: gotolink.replace(/&amp;/g, "&"),
        logo,
        dateEnd,
        discount,
        customerType,
      });
    }

    console.log("Campaigns count:", campaigns.size);
    console.log("Coupons count:", coupons.length);
    console.log("Sample coupon 1:", JSON.stringify(coupons[0], null, 2));
    console.log("Sample coupon 2:", JSON.stringify(coupons[1], null, 2));
  });
});
