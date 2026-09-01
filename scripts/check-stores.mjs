import { getStores, getCoupons } from "./src/lib/perfluence.js";

async function main() {
  const coupons = await getCoupons();
  console.log("Total coupons from getCoupons():", coupons.length);
  const stores = await getStores();
  console.log("Total stores from getStores():", stores.length);
  console.log(
    "Store slugs:",
    stores.map((s) => s.slug),
  );
}

main().catch(console.error);
