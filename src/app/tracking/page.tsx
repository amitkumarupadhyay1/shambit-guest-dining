"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";

export default function TrackingPage() {
  const router = useRouter();
  const { session, updateSession, guestToken } = useSessionStore();
  
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await api.getSessionStatus();
        updateSession(res.session);
      } catch (err) {
        console.error(err);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [updateSession]);

  const handleRequestBill = async () => {
    if (!guestToken) return;
    try {
      await api.requestBill(guestToken);
      router.push("/bill");
    } catch {
      alert("Could not request bill");
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 p-6">
        <h1 className="text-2xl font-bold mb-6 text-slate-900">Your Orders</h1>
        
        {session?.active_orders?.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 mb-6">You haven&apos;t ordered anything yet.</p>
            <Button onClick={() => router.push("/menu")}>Browse Menu</Button>
          </div>
        ) : (
          <div className="space-y-4 mb-8">
            {session?.active_orders?.map(order => (
              <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                <div className="flex justify-between items-center mb-3">
                  <span className="font-semibold text-slate-700">Order #{order.id}</span>
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">
                    {order.lifecycle}
                  </span>
                </div>
                <div className="space-y-2 text-sm text-slate-600">
                  {order.items.map(item => (
                    <div key={item.id} className="flex justify-between">
                      <span>{item.quantity}x Item #{item.menu_item}</span>
                      <span>{item.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.1)] flex gap-4">
          <Button variant="secondary" className="flex-1" onClick={() => router.push("/menu")}>
            Order More
          </Button>
          <Button variant="primary" className="flex-1" onClick={handleRequestBill}>
            Request Bill
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
