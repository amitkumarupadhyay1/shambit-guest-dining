import { useCartStore } from "./useCartStore";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Restaurant,
  TableInfo,
  Session,
  MenuItem,
  Category,
  ScanResponse,
} from "@/types";

interface SessionState {
  guestToken: string | null;
  restaurant: Restaurant | null;
  table: TableInfo | null;
  session: Session | null;
  menuItems: MenuItem[];
  categories: Category[];
  orderingEnabled: boolean;
  canStartSession: boolean;
  contextType: "DINE_IN" | "ROOM_SERVICE";
  serviceAvailable: boolean;
  scanCode: string | null;
  setFromScan: (data: ScanResponse, code?: string) => void;
  updateSession: (session: Session | null) => void;
  updateToken: (token: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set, get) => ({
      contextType: "DINE_IN",
      serviceAvailable: true,
      scanCode: null,
      guestToken: null,
      restaurant: null,
      table: null,
      session: null,
      menuItems: [],
      categories: [],
      orderingEnabled: false,
      canStartSession: false,
      setFromScan: (data, code) => {
        const previous = get();
        if (
          previous.restaurant?.id !== data.restaurant.id ||
          previous.table?.id !== data.table.id ||
          previous.contextType !== (data.context_type ?? "DINE_IN") ||
          previous.session?.id !== data.session?.id
        )
          useCartStore.getState().clearCart();
        if (typeof window !== "undefined")
          localStorage.setItem("guest_token", data.guest_token);
        set({
          contextType: data.context_type ?? "DINE_IN",
          serviceAvailable: data.service_available ?? true,
          scanCode: code ?? previous.scanCode,
          guestToken: data.guest_token,
          restaurant: data.restaurant,
          table: data.table,
          session: data.session,
          menuItems: data.menu_items,
          categories: data.categories,
          orderingEnabled: data.ordering_enabled,
          canStartSession: data.can_start_session,
        });
      },
      updateSession: (session) =>
        set({
          session,
          orderingEnabled: session?.status === "OPEN",
          canStartSession: false,
        }),
      updateToken: (token) => {
        if (typeof window !== "undefined") {
          localStorage.setItem("guest_token", token);
        }
        set({ guestToken: token, orderingEnabled: true });
      },
      reset: () => {
        if (typeof window !== "undefined") {
          localStorage.removeItem("guest_token");
        }
        set({
          guestToken: null,
          contextType: "DINE_IN",
          serviceAvailable: true,
          scanCode: null,
          restaurant: null,
          table: null,
          session: null,
          menuItems: [],
          categories: [],
          orderingEnabled: false,
          canStartSession: false,
        });
      },
    }),
    {
      name: "session-storage",
    },
  ),
);
