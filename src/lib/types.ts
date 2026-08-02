export interface Promocode {
  id: number;
  code: string;
  bonusName: string | null;
  terms: string | null;
  expires: string | null; // ISO-дата
  isHit: boolean;
  isUniversal: boolean;
  isFirstOrderOnly: boolean;
  region: string | null;
  isBarcode: boolean;
  barcodeImage: string | null;
  group: string | null;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  category: string; // русское имя категории из API
  categorySlug: string; // транслит категории
  about: string | null;
  conditions: string | null;
  site: string;
  activeBloggers: number;
}

export interface Affiliate {
  link: string;
  landingLink: string;
  ordMarker: string;
  ordText: string;
}

export interface Coupon {
  id: number; // = id промокода, используется как key
  promocode: Promocode;
  store: Store;
  affiliate: Affiliate;
  extraLinks: { title: string; link: string }[];
}
