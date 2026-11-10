/**
 * Indexing rule for store pages, shared by the page's robots meta and the
 * XML sitemap so the two can never disagree.
 *
 * Yandex Webmaster drops pages it calls "low-value", and a store page that is
 * only a brand name, one code and generated text is the typical case. Stores
 * imported automatically from Admitad (slug `admitad-<id>-<name>`) are the
 * least likely to be searched for, so they need at least two live offers.
 * Curated stores (Perfluence, known brands) stay indexable with a single
 * offer: Yandex shows e.g. the Ostrovok page, which has one.
 */
export const MIN_OFFERS_AUTO_IMPORTED_STORE = 2;

export function isAutoImportedStore(slug: string): boolean {
  return slug.trim().toLowerCase().startsWith("admitad-");
}

export function isStoreIndexable(slug: string, liveOfferCount: number): boolean {
  if (liveOfferCount <= 0) return false;
  if (isAutoImportedStore(slug)) return liveOfferCount >= MIN_OFFERS_AUTO_IMPORTED_STORE;
  return true;
}
