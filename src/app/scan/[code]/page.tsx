"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { api } from "@/lib/api";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { use } from "react";
import { getErrorMessage } from "@/lib/utils";

export default function ScanPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const router = useRouter();
  const { code } = use(params);
  const setFromScan = useSessionStore((state) => state.setFromScan);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function scan() {
      try {
        const data = await api.scan(code);
        if (cancelled) return;
        setFromScan(data, code);
        // A QR scan begins a new guest journey. Collect the guest details
        // before showing any menu items.
        router.replace(
          data.context_type === "ROOM_SERVICE"
            ? "/welcome"
            : data.session
              ? "/menu"
              : "/register",
        );
      } catch (err: unknown) {
        if (cancelled) return;
        setError(
          getErrorMessage(err, "Could not open this code. Please try again."),
        );
      }
    }
    void scan();
    return () => {
      cancelled = true;
    };
  }, [code, router, setFromScan]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        {error ? (
          <div className="relative z-10 bg-slate-800/50 p-8 rounded-3xl border border-slate-700/50 backdrop-blur-md">
            <h1 className="text-3xl font-bold mb-4 text-red-400">Oops!</h1>
            <p className="text-slate-300 text-lg">{error}</p>
          </div>
        ) : (
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-24 h-24 mb-8 relative animate-pulse">
              <Image
                src="/logo.png"
                alt="Logo"
                fill
                className="object-contain"
              />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Preparing your welcome…
            </h1>
            <p className="text-amber-400 font-medium">Getting the menu ready</p>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
