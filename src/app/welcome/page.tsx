"use client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";

export default function WelcomePage() {
  const router = useRouter();
  const { restaurant, table, session } = useSessionStore();

  if (!restaurant || !table) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Loading...
      </div>
    );
  }

  const handleStart = () => {
    if (session) {
      router.push("/menu");
    } else {
      router.push("/register");
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen flex flex-col items-center justify-between p-6 bg-slate-900 text-slate-50 relative overflow-hidden">
        {/* Abstract Background Accents */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="w-full flex justify-center mt-12 relative z-10">
          <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md shadow-2xl">
            <Image
              src="/logo.png"
              alt="Logo"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>
        </div>

        <div className="w-full max-w-md relative z-10 flex flex-col items-center text-center mt-8 flex-1">
          <div className="inline-block bg-amber-500/20 text-amber-400 border border-amber-500/30 px-5 py-1.5 rounded-full text-sm font-semibold tracking-wide mb-8 shadow-sm">
            Table {table.number}
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">
            {restaurant.name}
          </h1>
          {restaurant.hotel_name && (
            <p className="text-lg font-medium text-amber-400 mb-2">
              at {restaurant.hotel_name}
            </p>
          )}
          <p className="text-slate-400 text-sm max-w-[250px] mx-auto mb-8 leading-relaxed">
            {restaurant.address}
          </p>

          <div className="relative">
            <span className="absolute -left-4 -top-2 text-3xl text-slate-700 font-serif">
              &quot;
            </span>
            <p className="text-slate-300 font-medium italic text-lg px-6 leading-relaxed">
              {restaurant.welcome_message}
            </p>
            <span className="absolute -right-4 -bottom-4 text-3xl text-slate-700 font-serif">
              &quot;
            </span>
          </div>
        </div>

        <div className="w-full max-w-md pb-8 relative z-10">
          <Button
            className="w-full text-lg py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-[0.98]"
            onClick={handleStart}
          >
            {session ? "Continue Your Order" : "Start Ordering"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
