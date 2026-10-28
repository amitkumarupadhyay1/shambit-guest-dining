"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { BillSummary } from "@/types";
import { Download, QrCode } from "lucide-react";

export default function BillPage() {
  const router = useRouter();
  const [bill, setBill] = useState<BillSummary | null>(null);
  const { restaurant, contextType } = useSessionStore();

  useEffect(() => {
    api.getBillSummary().then(setBill).catch(console.error);
  }, []);

  if (!bill || !restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-400">
        Loading Bill...
      </div>
    );
  }

  const handleDownload = () => {
    window.open(api.getBillDownloadUrl(), "_blank");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 text-slate-50 p-6 pb-48 relative overflow-hidden flex flex-col">
        {/* Abstract Background */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl relative">
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-slate-900 rounded-full" />
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-slate-900 rounded-full" />
            <div className="absolute -bottom-4 -left-4 w-8 h-8 bg-slate-900 rounded-full" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-slate-900 rounded-full" />

            <div className="text-center mb-6 border-b-2 border-dashed border-slate-200 pb-6">
              <Image
                src="/logo.png"
                alt="Logo"
                width={60}
                height={60}
                className="mx-auto mb-3"
              />
              <h1 className="text-xl font-bold text-slate-900">
                {restaurant.name}
              </h1>
              {restaurant.hotel_name && (
                <p className="text-sm font-semibold text-amber-600 mb-1">
                  {restaurant.hotel_name}
                </p>
              )}
              <p className="text-slate-500 text-xs">{restaurant.address}</p>
              <p className="text-slate-900 text-sm mt-3 font-bold bg-slate-100 inline-block px-4 py-1 rounded-full">
                {contextType === "ROOM_SERVICE" ? "Room" : "Table"}{" "}
                {bill.table_number}
              </p>
            </div>

            <div className="space-y-4 mb-6 text-sm">
              <h3 className="font-bold text-slate-400 uppercase text-xs tracking-wider mb-2">
                Order Items
              </h3>
              {bill.items.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start">
                  <div className="flex-1 pr-4">
                    <span className="font-semibold text-slate-800">
                      {item.name}
                    </span>
                    <div className="text-slate-500 text-xs mt-0.5">
                      {item.quantity} x {formatCurrency(item.unit_price)}
                    </div>
                  </div>
                  <span className="font-bold text-slate-800">
                    {formatCurrency(item.line_total)}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t-2 border-dashed border-slate-200 pt-4 space-y-2 text-sm text-slate-600 mb-6">
              <div className="flex justify-between font-medium">
                <span>Subtotal</span>
                <span>{formatCurrency(bill.subtotal)}</span>
              </div>
              {bill.taxes.map((tax, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span>{tax.name}</span>
                  <span>{formatCurrency(tax.amount)}</span>
                </div>
              ))}
            </div>

            <div className="border-t-4 border-slate-900 pt-4 flex justify-between items-center mb-2 bg-slate-50 p-4 rounded-xl">
              <span className="font-extrabold text-lg text-slate-900 uppercase">
                Grand Total
              </span>
              <span className="font-extrabold text-2xl text-emerald-600">
                {formatCurrency(bill.grand_total)}
              </span>
            </div>
          </div>

          <div className="flex justify-center mt-6">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 text-amber-400 font-semibold hover:text-amber-300 transition-colors"
            >
              <Download className="w-4 h-4" /> Download PDF Receipt
            </button>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-slate-900 border-t border-slate-800 shadow-xl z-20">
          <div className="max-w-md mx-auto space-y-3">
            {restaurant.payment_settings?.accept_upi && (
              <div className="bg-slate-800 rounded-2xl p-4 flex items-center justify-between border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Pay via UPI
                    </p>
                    <p className="text-sm font-bold text-white">
                      {restaurant.payment_settings.upi_id}
                    </p>
                  </div>
                </div>
              </div>
            )}
            <Button
              className="w-full py-4 text-lg bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-2xl shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
              onClick={() => router.push("/thank-you")}
            >
              {contextType === "ROOM_SERVICE"
                ? "Done · settle with the hotel"
                : "Done / Pay at Counter"}
            </Button>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
