"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { api } from "@/lib/api";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import { formatCurrency, getErrorMessage } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { guestToken, restaurant, table } = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quotedTotal, setQuotedTotal] = useState<string | null>(null);

  const subtotal = getTotalPrice();

  useEffect(() => {
    if (!guestToken || items.length === 0) return;
    api
      .quoteOrder(
        guestToken,
        items.map((item) => ({
          menu_item: item.menuItemId,
          quantity: item.quantity,
        })),
      )
      .then((quote) => setQuotedTotal(quote.grand_total))
      .catch(() => setQuotedTotal(null));
  }, [guestToken, items]);

  const handlePlaceOrder = async () => {
    if (!guestToken || items.length === 0) return;
    setLoading(true);
    setError("");
    try {
      await api.placeOrder(
        guestToken,
        crypto.randomUUID(),
        items.map((item) => ({
          menu_item: item.menuItemId,
          quantity: item.quantity,
          notes: item.specialInstructions,
        })),
      );
      clearCart();
      router.replace("/tracking");
    } catch (err: unknown) {
      setError(
        getErrorMessage(
          err,
          "We could not place your order. Please try again.",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-center">
        <div className="max-w-sm bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
          <h1 className="text-xl font-bold text-slate-900 mb-2">
            Your cart is empty
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            Add a dish before sending your order to the kitchen.
          </p>
          <Button onClick={() => router.replace("/menu")} className="w-full">
            Explore menu
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
            onClick={() => router.back()}
            className="w-11 h-11 grid place-items-center rounded-full bg-slate-100 text-slate-700"
            aria-label="Back to cart"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-slate-900">Review order</h1>
            <p className="text-xs text-slate-500">
              {restaurant?.name} · Table {table?.number}
            </p>
          </div>
        </header>
        <main className="max-w-lg mx-auto p-4 space-y-4">
          <section className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">Your dishes</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  className="flex justify-between gap-4 text-sm"
                  key={item.menuItemId}
                >
                  <div>
                    <p className="font-semibold text-slate-800">
                      {item.quantity}× {item.menuItemName}
                    </p>
                    {item.variant && (
                      <p className="text-xs text-slate-500">
                        {item.variant.name}
                      </p>
                    )}
                  </div>
                  <p className="font-bold text-slate-800">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </section>
          <section className="bg-emerald-50 rounded-3xl border border-emerald-100 p-5">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <p className="text-sm leading-6 text-emerald-900">
                Prices and availability are checked by the restaurant when your
                order is sent. Final taxes and charges, if any, appear on your
                bill.
              </p>
            </div>
          </section>
          {error && (
            <p className="text-sm font-medium text-red-600 px-1">{error}</p>
          )}
        </main>
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500">
                Restaurant-checked item total
              </p>
              <p className="text-xl font-extrabold text-slate-900">
                {formatCurrency(quotedTotal ?? subtotal)}
              </p>
            </div>
            <Button
              onClick={handlePlaceOrder}
              loading={loading}
              className="min-h-12 px-6 bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-5 h-5 mr-2" />
              Place order
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
