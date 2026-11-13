/**
 * Display-only cleanup of advertiser program names that Admitad exposes as
 * technical labels. Slugs, affiliate data and the raw snapshot are untouched.
 */
const EXPLICIT: Record<string, string> = {
  "интернет-магазин «билайн»": "Билайн",
};

export function cleanStoreName(raw: string): string {
  const name = (raw || "").replace(/\s+/g, " ").trim();
  const explicit = EXPLICIT[name.toLowerCase()];
  if (explicit) return explicit;
  // Технический хвост кампании: "Velodrive_RU", "Matras krovat RU". Дефис не трогаем.
  const stripped = name.replace(/[\s_]+RU(?=\s+old$|$)/, "");
  // Подчёркивания меняем только в технических именах без пробелов («Velodrive_RU»).
  const cleaned = (/\s/.test(name) ? stripped : stripped.replace(/_/g, " ")).trim();
  return cleaned.length >= 3 ? cleaned : name;
}

/** "Matras krovat RU old" is a legacy twin of "Matras krovat RU". */
const LEGACY = /\s+old$/i;
const twinKey = (name: string) => cleanStoreName(name.replace(LEGACY, "")).toLowerCase();

type ListedStore = {
  slug: string;
  name: string;
  coupons: { promocode: { code: string; bonusName?: string | null } }[];
};

// Акцию без кода сравниваем по названию бонуса; без кода и без названия — считаем уникальной.
const offerKey = (c: ListedStore["coupons"][number]) =>
  (c.promocode.code || c.promocode.bonusName || "").trim().toLowerCase();

/**
 * Hide a legacy twin from store lists only when the live twin exists and every
 * offer of the legacy one (code or code-free deal) is also at the twin.
 * The page, coupons and links stay.
 */
export function withoutLegacyTwins<T extends ListedStore>(stores: T[]): T[] {
  const live = new Map<string, Set<string>>();
  for (const s of stores) {
    if (s.slug.startsWith("admitad-") && !LEGACY.test(s.name)) {
      live.set(twinKey(s.name), new Set(s.coupons.map(offerKey).filter(Boolean)));
    }
  }
  return stores.filter((s) => {
    if (!s.slug.startsWith("admitad-") || !LEGACY.test(s.name)) return true;
    const twin = live.get(twinKey(s.name));
    if (!twin) return true;
    return s.coupons.some((c) => !offerKey(c) || !twin.has(offerKey(c)));
  });
}
