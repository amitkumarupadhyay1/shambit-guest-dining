import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCartStore } from "@/stores/useCartStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { cartEntryKey, orderPayload, pendingOrderKey } from "./orderPayload";
import { api, GuestApiError } from "./api";
import type { MenuItem, ScanResponse } from "@/types";
const dish = {
  id: 7,
  name: "Tea",
  price: "100.00",
  variants: [],
  modifiers: [],
} as unknown as MenuItem;
const regular = { id: 1, name: "Regular", price: "100" };
const large = { id: 2, name: "Large", price: "150" };
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  useCartStore.getState().clearCart();
  useSessionStore.getState().reset();
  vi.restoreAllMocks();
});
describe("guest order selections", () => {
  it("keeps distinct portions and extras separate, then edits just that row", () => {
    const cart = useCartStore.getState();
    cart.addItem(dish, 1, regular);
    cart.addItem(dish, 2, large);
    cart.addItem(dish, 1, regular);
    const rows = useCartStore.getState().items;
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.quantity)).toEqual([2, 2]);
    cart.updateQuantity(cartEntryKey(rows[1]), 3);
    expect(useCartStore.getState().items.map((row) => row.quantity)).toEqual([
      2, 3,
    ]);
    expect(useCartStore.getState().getItemQuantity(7)).toBe(5);
    cart.removeItem(cartEntryKey(rows[0]));
    expect(useCartStore.getState().items[0].variant?.id).toBe(2);
  });
  it("sends the complete selection, with no client price", () => {
    useCartStore
      .getState()
      .addItem(
        dish,
        2,
        large,
        [{ id: 8, name: "Milk", price_adjustment: "10" }],
        " No sugar ",
      );
    expect(orderPayload(useCartStore.getState().items)).toEqual([
      {
        menu_item: 7,
        quantity: 2,
        variant: 2,
        selected_modifiers: { modifier_ids: [8] },
        notes: "No sugar",
      },
    ]);
  });
  it("retains the retry key for the same payload across calls and separates sessions", () => {
    useCartStore.getState().addItem(dish);
    const payload = orderPayload(useCartStore.getState().items);
    const key = pendingOrderKey(44, payload);
    expect(pendingOrderKey(44, payload)).toBe(key);
    expect(pendingOrderKey(45, payload)).not.toBe(key);
    expect(pendingOrderKey(44, [{ ...payload[0], quantity: 2 }])).not.toBe(key);
  });
  it("uses the same full payload for the server quote and submission", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(
      async () =>
        new Response(JSON.stringify({ id: 9, grand_total: "320.00" }), {
          status: 200,
        }),
    );
    useCartStore.getState().addItem(dish, 2, large);
    const payload = orderPayload(useCartStore.getState().items);
    await api.quoteOrder("proof", payload);
    await api.placeOrder("proof", "same-key", payload);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body)).items).toEqual(
      payload,
    );
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body)).items).toEqual(
      payload,
    );
  });
  it("preserves actionable validation errors", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: ["Dish unavailable"] }), {
        status: 400,
      }),
    );
    await expect(api.quoteOrder("proof", [])).rejects.toMatchObject({
      status: 400,
      message: expect.stringContaining("Dish unavailable"),
    });
    expect(new GuestApiError("Expired", 403)).toBeInstanceOf(Error);
  });
});
describe("scan context", () => {
  const scan = {
    context_type: "ROOM_SERVICE",
    guest_token: "proof",
    restaurant: { id: 2 },
    table: { id: 7, number: "205" },
    session: { id: 44, status: "OPEN" },
    menu_items: [],
    categories: [],
    ordering_enabled: true,
    can_start_session: false,
  } as unknown as ScanResponse;
  it("persists verified proof, retains same-room cart and clears a different room", () => {
    useSessionStore.getState().setFromScan(scan, "room-code");
    expect(localStorage.getItem("guest_token")).toBe("proof");
    useCartStore.getState().addItem(dish);
    useSessionStore.getState().setFromScan(scan, "room-code");
    expect(useCartStore.getState().items).toHaveLength(1);
    useSessionStore
      .getState()
      .setFromScan(
        { ...scan, table: { id: 8, number: "206" }, session: null },
        "other-code",
      );
    expect(useCartStore.getState().items).toHaveLength(0);
    expect(useSessionStore.getState().scanCode).toBe("other-code");
  });
});

it("normalises the backend's structured correction response", async () => {
  vi.spyOn(globalThis, "fetch").mockResolvedValue(
    new Response(
      JSON.stringify({
        error: "Check the total",
        details: {
          detail: "Prices changed. Check the total.",
          code: "QUOTE_CHANGED",
        },
      }),
      { status: 400 },
    ),
  );
  await expect(api.quoteOrder("proof", [])).rejects.toMatchObject({
    message: "Prices changed. Check the total.",
    details: { code: "QUOTE_CHANGED" },
  });
});

it("keeps read requests tied to the current tab's room proof", async () => {
  useSessionStore.setState({ guestToken: "this-room-proof" });
  localStorage.setItem("guest_token", "other-tab-room-proof");
  const request = vi
    .spyOn(globalThis, "fetch")
    .mockResolvedValue(
      new Response(JSON.stringify({ session: null }), { status: 200 }),
    );
  await api.getSessionStatus();
  expect(
    (request.mock.calls[0][1]?.headers as Record<string, string>)[
      "X-Guest-Token"
    ],
  ).toBe("this-room-proof");
  expect(api.getBillDownloadUrl()).toContain("this-room-proof");
});
