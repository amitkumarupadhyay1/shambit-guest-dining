"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/stores/useCartStore";
import { useSessionStore } from "@/stores/useSessionStore";
import { api } from "@/lib/api";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import { formatCurrency, getErrorMessage } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { guestToken } = useSessionStore();
  const [loading, setLoading] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [orderId, setOrderId] = useState<number | null>(null);
  const [captchaCode, setCaptchaCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  
  const subtotal = getTotalPrice();
  const tax = subtotal * 0.05;
  const grandTotal = subtotal + tax;

  const handlePlaceOrder = async () => {
    if (!guestToken) return;
    setLoading(true);
    try {
      const orderItems = items.map(i => ({ menu_item: i.menuItemId, quantity: i.quantity }));
      const res = await api.placeOrder(guestToken, Date.now().toString(), orderItems);
      setOrderId(res.id);
      setCaptchaCode(res.captcha_code);
      setShowCaptcha(true);
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Failed to place order"));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!guestToken || !orderId) return;
    if (inputCode !== captchaCode) {
      alert("Invalid code");
      return;
    }
    setLoading(true);
    try {
      await api.verifyCaptcha(guestToken, orderId, inputCode);
      clearCart();
      router.push("/tracking");
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Verification failed"));
    } finally {
      setLoading(false);
    }
  };

  if (showCaptcha) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900/50 backdrop-blur-sm">
        <div className="bg-white p-8 rounded-3xl w-full max-w-sm text-center">
          <h2 className="text-xl font-bold mb-2">Verify Your Order</h2>
          <p className="text-slate-500 mb-6">Enter the code shown below</p>
          <div className="text-4xl font-mono tracking-[0.5em] font-bold text-slate-800 mb-6 bg-slate-100 py-4 rounded-xl">
            {captchaCode}
          </div>
          <input 
            type="text" 
            maxLength={4}
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value.toUpperCase())}
            className="w-full text-center text-2xl tracking-[0.5em] font-mono py-3 border-2 border-slate-200 rounded-xl mb-6 outline-none focus:border-emerald-500"
            placeholder="----"
          />
          <Button className="w-full" onClick={handleVerify} loading={loading}>Confirm Order</Button>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="bg-white p-4 flex items-center border-b border-slate-100">
          <button onClick={() => router.back()} className="p-2 -ml-2 text-slate-600">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold ml-2">Checkout</h1>
        </div>

        <div className="p-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-4">
            <h2 className="font-bold text-slate-800 mb-4">Bill Summary</h2>
            <div className="flex justify-between text-slate-600">
              <span>Item Total</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between text-slate-600 pb-4 border-b border-slate-100">
              <span>Taxes (5%)</span>
              <span>{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg pt-2">
              <span>Grand Total</span>
              <span>{formatCurrency(grandTotal)}</span>
            </div>
          </div>
        </div>

        <div className="mt-auto p-6">
          <Button className="w-full py-4 text-lg" onClick={handlePlaceOrder} loading={loading}>
            Place Order
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
