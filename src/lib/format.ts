export function daysLeft(iso: string | null): number {
  if (!iso) return Infinity;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export function formatExpires(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", {
    day: "numeric",
    month: "long",
  });
}

/**
 * Русское склонение по числу: plural(5, "предложение", "предложения", "предложений").
 * Нужен там, где число подставляется в текст — «4 предложений» читается как
 * машинный перевод и подрывает доверие к странице не меньше, чем битая вёрстка.
 */
export function plural(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}
