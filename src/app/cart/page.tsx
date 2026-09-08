"use client";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import { ArrowLeft, Trash2 } from "lucide-react";

export default function CartPage() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotalPrice } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-bold mb-4">Your cart is empty</h2>
        <Button onClick={() => router.push("/menu")}>Back to Menu</Button>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white p-4 flex items-center border-b border-slate-100">
          <button
            onClick={() => router.push("/menu")}
            className="p-2 -ml-2 text-slate-600"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold ml-2">Your Order</h1>
        </div>

        <div className="flex-1 p-4 space-y-4">
          {items.map((item) => (
            <div
              key={item.menuItemId}
              className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-slate-900">
                    {item.menuItemName}
                  </h3>
                  <p className="text-slate-500 text-sm mt-1">
                    {formatCurrency(item.price)} each
                  </p>
                  {item.variant && (
                    <p className="text-xs text-slate-500 mt-1">
                      {item.variant.name}
                    </p>
                  )}
                  {item.modifiers && item.modifiers.length > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {item.modifiers
                        .map((modifier) => modifier.name)
                        .join(", ")}
                    </p>
                  )}
                  {item.specialInstructions && (
                    <p className="text-xs text-amber-700 mt-1">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => removeItem(item.menuItemId)}
                  className="text-red-400 p-1"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-semibold">
                  {formatCurrency(item.price * item.quantity)}
                </span>
                <div className="flex items-center gap-3 bg-slate-100 rounded-lg p-1">
                  <button
                    className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold"
                    onClick={() =>
                      updateQuantity(item.menuItemId, item.quantity - 1)
                    }
                  >
                    -
                  </button>
                  <span className="w-4 text-center font-semibold">
                    {item.quantity}
                  </span>
                  <button
                    className="w-8 h-8 flex items-center justify-center text-slate-600 font-bold"
                    onClick={() =>
                      updateQuantity(item.menuItemId, item.quantity + 1)
                    }
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white p-6 border-t border-slate-100 rounded-t-3xl shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-600 font-medium">Subtotal</span>
            <span className="text-lg font-bold">
              {formatCurrency(getTotalPrice())}
            </span>
          </div>
          <Button
            className="w-full text-lg py-4"
            onClick={() => router.push("/checkout")}
          >
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
