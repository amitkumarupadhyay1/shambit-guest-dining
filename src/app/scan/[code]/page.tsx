"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { use } from "react";
import { getErrorMessage } from "@/lib/utils";

export default function ScanPage({ params }: { params: Promise<{ code: string }> }) {
  const router = useRouter();
  const { code } = use(params);
  const setFromScan = useSessionStore((state) => state.setFromScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function scan() {
      try {
        const data = await api.scan(code);
        setFromScan(data);
        router.push("/welcome");
      } catch (err: unknown) {
        setError(getErrorMessage(err, "Failed to scan table code."));
      }
    }
    scan();
  }, [code, router, setFromScan]);

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        {error ? (
          <div className="text-red-500">
            <h1 className="text-2xl font-bold mb-4">Oops!</h1>
            <p>{error}</p>
          </div>
        ) : (
          <div className="animate-pulse">
            <div className="w-20 h-20 bg-emerald-500 rounded-full mx-auto mb-6" />
            <h1 className="text-xl font-medium text-slate-800">Loading your experience...</h1>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
