"use client";
import { useRouter } from "next/navigation";
import { cartEntryKey } from "@/lib/orderPayload";
import { useCartStore } from "@/stores/useCartStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  ShoppingBag,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();
  const { restaurant, table, contextType } = useSessionStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm bg-white rounded-3xl border border-slate-100 p-8 shadow-sm w-full">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Looks like you haven&apos;t added any dishes yet.
          </p>
          <Button onClick={() => router.push("/menu")} className="w-full">
            Explore Menu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 pb-[calc(8rem+env(safe-area-inset-bottom))]">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-100 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => router.push("/menu")}
            className="w-11 h-11 grid place-items-center rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
            aria-label="Back to menu"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900">Your Order</h1>
            <p className="text-xs text-slate-500">
              {restaurant?.name
                ? `${restaurant.name} · ${contextType === "ROOM_SERVICE" ? "Room" : "Table"} ${table?.number}`
                : `${items.length} ${items.length === 1 ? "item" : "items"}`}
            </p>
          </div>
        </header>

        <main className="max-w-lg mx-auto p-4 space-y-4">
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <motion.div
                key={cartEntryKey(item)}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100"
              >
                <div className="flex justify-between items-start mb-4 gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-slate-900 mb-1 leading-tight text-lg">
                      {item.menuItemName}
                    </h3>
                    <p className="font-bold text-emerald-700 text-sm mb-2">
                      {formatCurrency(item.price)}{" "}
                      <span className="text-slate-400 font-normal text-xs ml-1">
                        each
                      </span>
                    </p>
                    {item.variant && (
                      <p className="text-xs font-medium text-slate-600 bg-slate-100 inline-block px-2 py-1 rounded-md mb-1">
                        Size: {item.variant.name}
                      </p>
                    )}
                    {item.modifiers && item.modifiers.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">
                        <span className="font-semibold text-slate-600">
                          Add-ons:
                        </span>{" "}
                        {item.modifiers
                          .map((modifier) => modifier.name)
                          .join(", ")}
                      </p>
                    )}
                    {item.specialInstructions && (
                      <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                        <p className="text-xs text-amber-800">
                          <span className="font-bold">Note:</span>{" "}
                          {item.specialInstructions}
                        </p>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => removeItem(cartEntryKey(item))}
                    className="w-10 h-10 flex-shrink-0 grid place-items-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                  <span className="font-bold text-lg text-slate-900">
                    {formatCurrency(item.price * item.quantity)}
                  </span>

                  <div className="flex items-center gap-2 bg-emerald-50 rounded-full p-1 border border-emerald-100">
                    <button
                      className="w-8 h-8 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors"
                      onClick={() =>
                        updateQuantity(cartEntryKey(item), item.quantity - 1)
                      }
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-6 text-center font-bold text-sm text-emerald-900">
                      {item.quantity}
                    </span>
                    <button
                      className="w-8 h-8 rounded-full bg-emerald-500 shadow-sm flex items-center justify-center text-white hover:bg-emerald-600 transition-colors"
                      onClick={() =>
                        updateQuantity(cartEntryKey(item), item.quantity + 1)
                      }
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </main>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-0.5">
                Total Amount
              </p>
              <p className="text-2xl font-extrabold text-slate-900">
                {formatCurrency(getTotalPrice())}
              </p>
            </div>
            <Button
              className="px-6 min-h-[56px] text-base"
              onClick={() => router.push("/checkout")}
            >
              Checkout
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
