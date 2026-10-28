"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { useCartStore } from "@/stores/useCartStore";
import { useSessionStore } from "@/stores/useSessionStore";
import {
  cartEntryKey,
  orderPayload,
  pendingOrderKey,
  clearPendingOrder,
} from "@/lib/orderPayload";
import { api, GuestApiError, type GuestQuote } from "@/lib/api";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import { formatCurrency, getErrorMessage } from "@/lib/utils";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();
  const { guestToken, restaurant, table, session, contextType, scanCode } =
    useSessionStore();
  const [quoteAttempt, setQuoteAttempt] = useState(0);
  const [accessExpired, setAccessExpired] = useState(false);
  const [duplicatePending, setDuplicatePending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [quote, setQuote] = useState<GuestQuote | null>(null);
  const submitting = useRef(false);

  const [quoteFingerprint, setQuoteFingerprint] = useState("");
  const fingerprint = JSON.stringify(orderPayload(items));
  const quoteIsCurrent = quoteFingerprint === fingerprint;

  useEffect(() => {
    if (!guestToken || items.length === 0) return;
    let cancelled = false;
    api
      .quoteOrder(guestToken, orderPayload(items))
      .then((result) => {
        if (!cancelled) {
          setQuote(result);
          setQuoteFingerprint(JSON.stringify(orderPayload(items)));
          setError("");
        }
      })
      .catch((failure) => {
        if (!cancelled) {
          setQuote(null);
          setAccessExpired(
            failure instanceof GuestApiError && failure.status === 403,
          );
          setError(
            getErrorMessage(
              failure,
              "Could not check this order. Please return to the menu.",
            ),
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, [guestToken, items, quoteAttempt]);

  const handlePlaceOrder = async (confirmDuplicate = false) => {
    if (
      !guestToken ||
      !session ||
      !quote ||
      !quoteIsCurrent ||
      submitting.current ||
      items.length === 0
    )
      return;
    submitting.current = true;
    setLoading(true);
    setError("");
    try {
      const payload = orderPayload(items);
      await api.placeOrder(
        guestToken,
        pendingOrderKey(session.id, payload),
        payload,
        confirmDuplicate,
        quote.quote_token,
      );
      clearPendingOrder(session.id);
      clearCart();
      router.replace("/tracking");
    } catch (err: unknown) {
      if (
        err instanceof GuestApiError &&
        String(err.details.code ?? "").startsWith("QUOTE_")
      )
        setQuote(null);
      setDuplicatePending(
        err instanceof GuestApiError && !!err.details.possible_duplicate,
      );
      setAccessExpired(err instanceof GuestApiError && err.status === 403);
      if (
        session &&
        err instanceof GuestApiError &&
        err.status >= 400 &&
        err.status < 500
      )
        clearPendingOrder(session.id);
      setError(
        getErrorMessage(
          err,
          "We could not place your order. Please try again.",
        ),
      );
    } finally {
      submitting.current = false;
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
              {restaurant?.name} ·{" "}
              {contextType === "ROOM_SERVICE" ? "Room" : "Table"}{" "}
              {table?.number}
            </p>
          </div>
        </header>
        <main className="max-w-lg mx-auto p-4 space-y-4">
          <section className="bg-white rounded-3xl border border-slate-100 p-5 shadow-sm">
            <h2 className="font-bold text-slate-900 mb-4">Your dishes</h2>
            <div className="space-y-3">
              {items.map((item, index) => (
                <div
                  className="flex justify-between gap-4 text-sm"
                  key={cartEntryKey(item)}
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
                    {formatCurrency(
                      quote?.items[index]?.line_total ??
                        item.price * item.quantity,
                    )}
                  </p>
                </div>
              ))}
            </div>
          </section>
          {quote && (
            <details className="rounded-2xl border border-slate-100 bg-white p-5 text-sm">
              <summary className="cursor-pointer font-medium">
                Price details
              </summary>
              <div className="mt-3 space-y-2">
                <p className="flex justify-between">
                  <span>Before tax</span>
                  <span>{formatCurrency(quote.subtotal)}</span>
                </p>
                {quote.taxes.map((tax, index) => (
                  <p key={index} className="flex justify-between gap-3">
                    <span>{tax.name}</span>
                    <span>{formatCurrency(tax.amount)}</span>
                  </p>
                ))}
              </div>
            </details>
          )}
          <section className="bg-emerald-50 rounded-3xl border border-emerald-100 p-5">
            <div className="flex gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0" />
              <p className="text-sm leading-6 text-emerald-900">
                {quote?.final_bill_note ||
                  "Checking current prices and availability…"}
              </p>
            </div>
          </section>
          {error && (
            <div
              role="alert"
              className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
            >
              <p>{error}</p>
              {duplicatePending ? (
                <button
                  className="mt-3 font-semibold underline"
                  disabled={loading}
                  onClick={() => void handlePlaceOrder(true)}
                >
                  Order this again
                </button>
              ) : accessExpired && scanCode ? (
                <button
                  className="mt-3 font-semibold underline"
                  onClick={() => router.push(`/scan/${scanCode}`)}
                >
                  Reopen room / table code
                </button>
              ) : (
                !quote && (
                  <button
                    className="mt-3 font-semibold underline"
                    onClick={() => setQuoteAttempt((value) => value + 1)}
                  >
                    Recheck order
                  </button>
                )
              )}
            </div>
          )}
        </main>
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-100 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="max-w-lg mx-auto flex items-center gap-4">
            <div className="flex-1">
              <p className="text-xs text-slate-500">Order total</p>
              <p className="text-xl font-extrabold text-slate-900">
                {quote && quoteIsCurrent
                  ? formatCurrency(quote.grand_total)
                  : "Checking…"}
              </p>
            </div>
            <Button
              onClick={() => void handlePlaceOrder()}
              loading={loading}
              disabled={
                loading ||
                !quote ||
                !quoteIsCurrent ||
                !session ||
                session.status !== "OPEN"
              }
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
