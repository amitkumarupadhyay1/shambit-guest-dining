import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  Restaurant,
  TableInfo,
  Session,
  MenuItem,
  Category,
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
  setFromScan: (data: {
    guest_token: string;
    restaurant: Restaurant;
    table: TableInfo;
    session: Session | null;
    menu_items: MenuItem[];
    categories: Category[];
    ordering_enabled: boolean;
    can_start_session: boolean;
  }) => void;
  updateSession: (session: Session | null) => void;
  updateToken: (token: string) => void;
  reset: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      guestToken: null,
      restaurant: null,
      table: null,
      session: null,
      menuItems: [],
      categories: [],
      orderingEnabled: false,
      canStartSession: false,
      setFromScan: (data) => {
        set({
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
      updateSession: (session) => set({ session }),
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
