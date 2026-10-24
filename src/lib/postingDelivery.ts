import "server-only";
import { createHash } from "node:crypto";
import { getSupabaseAdmin } from "@/lib/supabase";
import type { Coupon } from "@/lib/types";

/** Enable only after the posting_delivery_ledger migration is applied. */
export async function deliverOnce<T extends { ok: boolean }>(
  channel: "telegram" | "vk",
  coupon: Coupon,
  send: () => Promise<T>,
  messageId: (result: T) => number | undefined,
): Promise<T> {
  if (process.env.POSTING_LEDGER_ENABLED !== "true") return send();
  const db = getSupabaseAdmin();
  if (!db) throw new Error("Posting ledger is not configured; delivery blocked");
  const key = createHash("sha256")
    .update(JSON.stringify([channel, coupon.store.slug, coupon.promocode.code.trim().toUpperCase()]))
    .digest("hex");
  const { data, error } = await db.rpc("reserve_posting_delivery", {
    p_key: key, p_channel: channel, p_store: coupon.store.slug,
  });
  if (error) throw new Error("Posting reservation unavailable; delivery blocked");
  if (data !== true) throw new Error("Delivery already reserved or sent; manual review required");

  // Keep the reservation on any failure/timeout, including an uncertain response.
  const result = await send();
  if (result.ok) {
    const { error: writeError } = await db.from("posting_deliveries").update({
      status: "sent", sent_at: new Date().toISOString(), message_id: messageId(result) ?? null,
    }).eq("delivery_key", key);
    if (writeError) throw new Error("Delivery sent but ledger completion failed; do not retry");
  }
  return result;
}
