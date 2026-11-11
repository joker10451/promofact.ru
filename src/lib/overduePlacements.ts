import type { Coupon } from "@/lib/types";

/**
 * ERIDs of publications that Perfluence lists under "Необходимо удалить" (offer clause 6.16):
 * ORD reporting stops 30 days after the post, so an ad that still carries one of these markers
 * is shown without reporting. Taken from the dashboard on 10 Nov 2026 (91 posts: site 61,
 * Telegram 23, Dzen 7).
 *
 * A coupon carrying any of them is dropped BEFORE de-duplication, so a fresh placement of the
 * same project from the widget takes its place; when the widget has none yet, the offer is
 * simply not shown. Add new ones from the dashboard list (Публикации → Необходимо удалить).
 */
export const OVERDUE_PLACEMENT_ERIDS: ReadonlySet<string> = new Set([
  // site (61)
  "2Ranymq94ZR",
  "2RanymzKnrw",
  "2RanymjD7S3",
  "2RanynXHSiw",
  "2Ranynn1Gx3",
  "2RanymqXEoM",
  "2Ranymp3FX1",
  "2Ranyo1nN4T",
  "2Ranyo4fyN3",
  "2RanynJ4HWB",
  "2Ranyn6Ahqm",
  "2RanynhqnEX",
  "2Ranyo4VZb1",
  "2Ranyo31aJf",
  "2RanymwK8XD",
  "2Ranymuq9Es",
  "2RanymtM9xX",
  "2RanymbzGXM",
  "2RanymKkRSb",
  "2RanynC1c4T",
  "2RanykDV59d",
  "2RanyoF7adh",
  "2RanynnP7i3",
  "2Ranynku8Rh",
  "2RanynunP9u",
  "2RanykzbK23",
  "2Ranyo7PWDh",
  "2RanynobeqZ",
  "2RanykNqXoq",
  "2RanykMXHVV",
  "2RanynXXtxs",
  "2Ranynq5e7u",
  "2RanynLoVAB",
  "2RanynobJpj",
  "2RanykEC3Sj",
  "2RanymLou2T",
  "2RanykKnWVH",
  "2RanymYcmsR",
  "2RanynHqWbV",
  "2RanymtDkgK",
  "2RanykUgmfH",
  "2RanykwNDFZ",
  "2Ranyn4bfej",
  "2RanynaFRHd",
  "2Ranynj9Lyh",
  "2RanykNkpXu",
  "2Ranyn65ew5",
  "2Ranymess9D",
  "2RanykFLt8B",
  "2RanymXTvjV",
  "2Ranyk7vwiT",
  "2RanynYfPQw",
  "2RanynSjSHZ",
  "2RanynhZK71",
  "2RanymxNatT",
  "2RanyoDYWqy",
  "2Ranyk7g9Y7",
  "2RanynFCKB1",
  "2RanymUAmpP",
  "2RanymGhNJ7",
  "2RanymXWEfm",
  // telegram (23)
  "2Ranyo7Lmrb",
  "2Ranynyn94F",
  "2RanynaQ9oq",
  "2RanykGT3LF",
  "2RanykdUem1",
  "2RanyninBsH",
  "2RanykAX6Cs",
  "2RanynSzDQ7",
  "2Ranyo1G8Lb",
  "2RanykWRCj5",
  "2RanynYtV7q",
  "2Ranyn3G5LF",
  "2RanynSb36T",
  "2RanykDb6uR",
  "2RanymroRFy",
  "2RanykMFSjm",
  "2RanymFMnjm",
  "2RanykkbktB",
  "2RanykjB8eP",
  "2RanynRNo63",
  "2RanyoEumRu",
  "2RanykNj6PM",
  "2RanyktWEYK",
  // dzen (7)
  "2RanykFca3u",
  "2Ranyk9ERHV",
  "2Ranyo8oMQX",
  "2RanymnD12T",
  "2RanynNJP2T",
  "2Ranyo18doq",
  "2Ranymrx6MZ",
]);

function eridsIn(text: string | undefined | null): string[] {
  return [...(text ?? "").matchAll(/erid[=: ]+([A-Za-z0-9]{8,})/gi)].map((m) => m[1]);
}

/** True when any marker, link or legal text of the coupon carries an overdue ERID. */
export function carriesOverduePlacement(c: Pick<Coupon, "affiliate"> & { extraLinks?: Coupon["extraLinks"] }): boolean {
  const a = c.affiliate;
  const found = [
    a.ordMarker,
    ...eridsIn(a.link), ...eridsIn(a.landingLink), ...eridsIn(a.ordText),
    ...(c.extraLinks ?? []).flatMap((l) => eridsIn(l.link)),
  ];
  return found.some((e) => !!e && OVERDUE_PLACEMENT_ERIDS.has(e));
}

/** Codes the partner reports as used up ("закончились промокоды"); they must not be shown even while the widget still lists them. */
export const EXHAUSTED_PROMO_CODES: ReadonlySet<string> = new Set([
  "PERPREGA309361", // СберЗдоровье: 30% на анализы для беременных, 11 Nov 2026
]);

export function isExhaustedCode(c: Pick<Coupon, "promocode">): boolean {
  return EXHAUSTED_PROMO_CODES.has(c.promocode.code.trim().toUpperCase());
}
