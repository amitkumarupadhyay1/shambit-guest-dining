import { cartEntryKey } from "@/lib/orderPayload";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MenuItem, MenuItemVariant, MenuItemModifier } from "@/types";

export interface CartEntry {
  menuItemId: number;
  menuItemName: string;
  price: number;
  quantity: number;
  variant?: MenuItemVariant;
  modifiers?: MenuItemModifier[];
  specialInstructions?: string;
}

interface CartState {
  items: CartEntry[];
  addItem: (
    item: MenuItem,
    qty?: number,
    variant?: MenuItemVariant,
    modifiers?: MenuItemModifier[],
    instructions?: string,
  ) => void;
  removeItem: (menuItemId: number | string) => void;
  updateQuantity: (menuItemId: number | string, quantity: number) => void;
  getItemQuantity: (menuItemId: number) => number;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (item, qty = 1, variant, modifiers, instructions) => {
        const price = variant
          ? parseFloat(variant.price)
          : parseFloat(item.price);
        const modifierTotal =
          modifiers?.reduce(
            (sum, m) => sum + parseFloat(m.price_adjustment),
            0,
          ) || 0;
        set((state) => {
          const key = cartEntryKey({
            menuItemId: item.id,
            variant,
            modifiers,
            specialInstructions: instructions,
          });
          const existing = state.items.find((i) => cartEntryKey(i) === key);
          if (existing) {
            return {
              items: state.items.map((i) =>
                cartEntryKey(i) === key
                  ? { ...i, quantity: Math.min(20, i.quantity + qty) }
                  : i,
              ),
            };
          }
          return {
            items: [
              ...state.items,
              {
                menuItemId: item.id,
                menuItemName: item.name,
                price: price + modifierTotal,
                quantity: qty,
                variant,
                modifiers,
                specialInstructions: instructions,
              },
            ],
          };
        });
      },
      removeItem: (menuItemId) =>
        set((state) => ({
          items: state.items.filter((i) =>
            typeof menuItemId === "string"
              ? cartEntryKey(i) !== menuItemId
              : i.menuItemId !== menuItemId,
          ),
        })),
      updateQuantity: (menuItemId, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) =>
                  typeof menuItemId === "string"
                    ? cartEntryKey(i) !== menuItemId
                    : i.menuItemId !== menuItemId,
                )
              : state.items.map((i) =>
                  (
                    typeof menuItemId === "string"
                      ? cartEntryKey(i) === menuItemId
                      : i.menuItemId === menuItemId
                  )
                    ? { ...i, quantity: Math.min(quantity, 20) }
                    : i,
                ),
        })),
      getItemQuantity: (menuItemId) =>
        get()
          .items.filter((i) => i.menuItemId === menuItemId)
          .reduce((sum, i) => sum + i.quantity, 0),
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () =>
        get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      clearCart: () => set({ items: [] }),
    }),
    { name: "shambit-guest-cart" },
  ),
);
