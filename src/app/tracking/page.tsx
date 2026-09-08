"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import {
  Check,
  Clock,
  Utensils,
  BellRing,
  PackageCheck,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";

const PIPELINE = [
  { id: "ordered", label: "Ordered", states: ["UNAPPROVED", "NEW"] },
  { id: "accepted", label: "Kitchen Accepted", states: ["ACCEPTED"] },
  { id: "cooking", label: "Cooking", states: ["PREPARING"] },
  { id: "ready", label: "Ready", states: ["READY"] },
  { id: "delivered", label: "Delivered", states: ["DELIVERED", "COMPLETED"] },
];

export default function TrackingPage() {
  const router = useRouter();
  const { session, updateSession, guestToken, menuItems } = useSessionStore();
  const [refreshing, setRefreshing] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    const loadStatus = async () => {
      try {
        const res = await api.getSessionStatus();
        updateSession(res.session);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingStatus(false);
      }
    };
    loadStatus();
    const interval = setInterval(loadStatus, 5000);
    return () => clearInterval(interval);
  }, [updateSession]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await api.getSessionStatus();
      updateSession(res.session);
    } finally {
      setTimeout(() => setRefreshing(false), 500);
    }
  };

  const handleRequestBill = async () => {
    if (!guestToken) return;
    try {
      await api.requestBill(guestToken);
      router.push("/bill");
    } catch {
      alert("Could not request bill");
    }
  };

  const getStepIndex = (lifecycle: string) => {
    const index = PIPELINE.findIndex((step) => step.states.includes(lifecycle));
    return index >= 0 ? index : 0;
  };

  const getItemName = (id: number) => {
    return menuItems.find((m) => m.id === id)?.name || `Item #${id}`;
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 flex flex-col pb-24">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/menu")}
              className="p-2 -ml-2 text-slate-600 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold text-slate-900">Live Tracking</h1>
          </div>
          <button
            onClick={handleRefresh}
            className={`p-2 text-emerald-600 bg-emerald-50 rounded-full ${refreshing ? "animate-spin" : ""}`}
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 flex-1">
          {loadingStatus ? (
            <div className="text-center py-16 px-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <Clock className="w-10 h-10 text-emerald-600 animate-pulse mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                Checking your order
              </h2>
              <p className="text-slate-500">
                Getting the latest update from the restaurant.
              </p>
            </div>
          ) : !session || session.active_orders.length === 0 ? (
            <div className="text-center py-16 px-6 bg-white rounded-3xl shadow-sm border border-slate-100">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Utensils className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 mb-2">
                No Active Orders
              </h2>
              <p className="text-slate-500 mb-6">
                Looks like you haven&apos;t ordered anything yet, or all your
                orders are completed.
              </p>
              <Button onClick={() => router.push("/menu")} className="w-full">
                Explore Menu
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {session?.active_orders?.map((order) => {
                const stepIndex = getStepIndex(order.lifecycle);

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6 relative z-10">
                      <div>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Order ID
                        </span>
                        <h3 className="text-lg font-bold text-slate-900">
                          #{order.id}
                        </h3>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                          {PIPELINE[stepIndex].label}
                        </span>
                      </div>
                    </div>

                    {/* Progress Pipeline */}
                    <div className="relative mb-8 pt-2">
                      <div className="absolute top-5 left-4 right-4 h-1 bg-slate-100 rounded-full" />
                      <div
                        className="absolute top-5 left-4 h-1 bg-emerald-500 rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `calc(${(stepIndex / (PIPELINE.length - 1)) * 100}% - 32px)`,
                        }}
                      />

                      <div className="relative flex justify-between">
                        {PIPELINE.map((step, i) => {
                          const isCompleted = i <= stepIndex;
                          const isActive = i === stepIndex;

                          let Icon = Check;
                          if (i === 0) Icon = Clock;
                          if (i === 1) Icon = Check;
                          if (i === 2) Icon = Utensils;
                          if (i === 3) Icon = BellRing;
                          if (i === 4) Icon = PackageCheck;

                          return (
                            <div
                              key={step.id}
                              className="flex flex-col items-center gap-2 z-10"
                            >
                              <div
                                className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-slate-300"} ${isActive ? "ring-4 ring-emerald-100" : ""}`}
                              >
                                <Icon className="w-4 h-4" />
                              </div>
                              <span
                                className={`text-[10px] font-bold text-center w-16 leading-tight ${isCompleted ? "text-emerald-700" : "text-slate-400"}`}
                              >
                                {step.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                        Order Items
                      </h4>
                      <div className="space-y-3">
                        {order.items.map((item) => (
                          <div
                            key={item.id}
                            className="flex justify-between items-start gap-4"
                          >
                            <div className="flex gap-3">
                              <div className="w-6 h-6 rounded bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center flex-shrink-0">
                                {item.quantity}x
                              </div>
                              <span className="font-medium text-slate-800 text-sm">
                                {getItemName(item.menu_item)}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-slate-400 mt-0.5">
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-100 flex gap-3 pb-8 z-40">
          <Button
            variant="secondary"
            className="flex-1 py-4 text-base font-bold bg-slate-100 text-slate-700 hover:bg-slate-200"
            onClick={() => router.push("/menu")}
          >
            Order More
          </Button>
          <Button
            className="flex-1 py-4 text-base font-bold bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-900/20"
            onClick={handleRequestBill}
          >
            Request Bill
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
