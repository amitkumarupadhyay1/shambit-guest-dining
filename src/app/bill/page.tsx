"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils";
import type { BillSummary } from "@/types";

export default function BillPage() {
  const router = useRouter();
  const [bill, setBill] = useState<BillSummary | null>(null);

  useEffect(() => {
    api.getBillSummary().then(setBill).catch(console.error);
  }, []);

  if (!bill) return <div className="p-8 text-center">Loading Bill...</div>;

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-100 p-6 pb-32">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="text-center mb-6 border-b border-dashed border-slate-300 pb-6">
            <h1 className="text-xl font-bold text-slate-900">{bill.restaurant.name}</h1>
            <p className="text-slate-500 text-sm mt-1">{bill.restaurant.address}</p>
            <p className="text-slate-500 text-sm mt-2 font-medium">Table {bill.table_number}</p>
          </div>

          <div className="space-y-4 mb-6 text-sm">
            {bill.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="font-medium">{item.name}</span>
                  <div className="text-slate-500">{item.quantity} x {formatCurrency(item.unit_price)}</div>
                </div>
                <span className="font-medium">{formatCurrency(item.line_total)}</span>
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-slate-300 pt-4 space-y-2 text-sm text-slate-600 mb-6">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(bill.subtotal)}</span>
            </div>
            {bill.taxes.map((tax, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{tax.name}</span>
                <span>{formatCurrency(tax.amount)}</span>
              </div>
            ))}
          </div>

          <div className="border-t-2 border-slate-800 pt-4 flex justify-between items-center mb-2">
            <span className="font-bold text-lg">Total</span>
            <span className="font-bold text-xl">{formatCurrency(bill.grand_total)}</span>
          </div>
        </div>

        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-xl flex gap-4">
          <Button className="w-full py-4 text-lg" onClick={() => router.push("/thank-you")}>
            Pay via Counter
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
