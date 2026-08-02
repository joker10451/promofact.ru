export function daysLeft(iso: string | null): number {
  if (!iso) return Infinity;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return Infinity;
  return Math.ceil((d.getTime() - Date.now()) / 86_400_000);
}

export function formatExpires(iso: string): string {
  return new Date(iso).toLocaleDateString("ru-RU", { day: "numeric", month: "long" });
}