import type { CartEntry } from "@/stores/useCartStore";
export function cartEntryKey(
  item: Pick<
    CartEntry,
    "menuItemId" | "variant" | "modifiers" | "specialInstructions"
  >,
): string {
  return JSON.stringify([
    item.menuItemId,
    item.variant?.id ?? 0,
    (item.modifiers ?? []).map((m) => m.id).sort((a, b) => a - b),
    (item.specialInstructions ?? "").trim(),
  ]);
}
export function orderPayload(items: CartEntry[]) {
  return items.map((item) => ({
    menu_item: item.menuItemId,
    quantity: item.quantity,
    variant: item.variant?.id ?? null,
    selected_modifiers: {
      modifier_ids: (item.modifiers ?? []).map((modifier) => modifier.id),
    },
    notes: (item.specialInstructions ?? "").trim().slice(0, 255),
  }));
}
/** Retain the same key across uncertain network retries, including reloads. */
export function pendingOrderKey(
  sessionId: number,
  payload: ReturnType<typeof orderPayload>,
): string {
  const storageKey = `guest-order:${sessionId}`;
  const fingerprint = JSON.stringify(payload);
  try {
    const previous = JSON.parse(sessionStorage.getItem(storageKey) ?? "null");
    if (
      previous?.fingerprint === fingerprint &&
      typeof previous.key === "string"
    )
      return previous.key;
  } catch {
    /* Replace obsolete browser data. */
  }
  const key = crypto.randomUUID();
  sessionStorage.setItem(storageKey, JSON.stringify({ fingerprint, key }));
  return key;
}
export function clearPendingOrder(sessionId: number) {
  sessionStorage.removeItem(`guest-order:${sessionId}`);
}
