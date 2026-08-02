const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z",
  и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r",
  с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts", ч: "ch", ш: "sh",
  щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya",
};

export function translit(input: string): string {
  const lower = input.toLowerCase().trim();
  let out = "";
  for (const ch of lower) {
    if (MAP[ch]) out += MAP[ch];
    else if (/[a-z0-9]/.test(ch)) out += ch;
    else out += "-";
  }
  return out.replace(/-{2,}/g, "-").replace(/^-|-$/g, "");
}

export function slugifyNames(names: string[]): string[] {
  const used = new Map<string, number>();
  return names.map((name) => {
    const base = translit(name) || "magazin";
    const key = `${base}-${name}`;
    const n = used.get(key) ?? 0;
    used.set(key, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  });
}