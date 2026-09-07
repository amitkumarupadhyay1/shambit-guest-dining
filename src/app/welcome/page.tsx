"use client";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";

export default function WelcomePage() {
  const router = useRouter();
  const { restaurant, table, session } = useSessionStore();

  if (!restaurant || !table) {
    return <div className="p-8 text-center">Loading...</div>;
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
      <div
        className="min-h-screen flex flex-col items-center justify-end p-6 bg-cover bg-center relative"
        style={{ backgroundImage: restaurant.cover_image ? `url(${restaurant.cover_image})` : 'linear-gradient(to bottom, #10b981, #064e3b)' }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 w-full max-w-md bg-white rounded-3xl p-8 text-center shadow-2xl mb-8">
          <div className="inline-block bg-slate-900 text-white px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Table {table.number}
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">{restaurant.name}</h1>
          <p className="text-slate-500 mb-6">{restaurant.address}</p>
          <p className="text-slate-700 font-medium mb-8">&quot;{restaurant.welcome_message}&quot;</p>
          
          <Button className="w-full text-lg py-4" onClick={handleStart}>
            {session ? "Continue Your Order" : "Start Ordering →"}
          </Button>
        </div>
      </div>
    </PageTransition>
  );
}
