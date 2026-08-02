import "server-only";

export const STATS_COOKIE = "stats-auth";

export async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function statsCookieValue(): Promise<string> {
  return sha256Hex(process.env.STATS_PASSWORD ?? "");
}
