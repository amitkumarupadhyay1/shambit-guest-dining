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
  addItem: (item: MenuItem, qty?: number, variant?: MenuItemVariant, modifiers?: MenuItemModifier[], instructions?: string) => void;
  removeItem: (menuItemId: number) => void;
  updateQuantity: (menuItemId: number, quantity: number) => void;
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
        const price = variant ? parseFloat(variant.price) : parseFloat(item.price);
        const modifierTotal = modifiers?.reduce((sum, m) => sum + parseFloat(m.price_adjustment), 0) || 0;
        set((state) => {
          const existing = state.items.find((i) => i.menuItemId === item.id);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.menuItemId === item.id ? { ...i, quantity: i.quantity + qty } : i
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
        set((state) => ({ items: state.items.filter((i) => i.menuItemId !== menuItemId) })),
      updateQuantity: (menuItemId, quantity) =>
        set((state) => ({
          items: quantity <= 0
            ? state.items.filter((i) => i.menuItemId !== menuItemId)
            : state.items.map((i) =>
                i.menuItemId === menuItemId ? { ...i, quantity: Math.min(quantity, 20) } : i
              ),
        })),
      getItemQuantity: (menuItemId) => get().items.find((i) => i.menuItemId === menuItemId)?.quantity || 0,
      getTotalItems: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
      getTotalPrice: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      clearCart: () => set({ items: [] }),
    }),
    { name: "shambit-guest-cart" }
  )
);
