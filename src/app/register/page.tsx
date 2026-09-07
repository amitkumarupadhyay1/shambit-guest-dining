"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSessionStore } from "@/stores/useSessionStore";
import { api } from "@/lib/api";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getErrorMessage } from "@/lib/utils";

export default function RegisterPage() {
  const router = useRouter();
  const { guestToken, updateToken, canStartSession } = useSessionStore();
  
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [covers, setCovers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestToken) return;
    
    setLoading(true);
    setError("");
    try {
      const res = await api.startSession(guestToken, covers, name, phone);
      updateToken(res.guest_token);
      router.push("/menu");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

  if (!canStartSession) {
    return <div className="p-8 text-center text-red-500">Session cannot be started.</div>;
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-50 p-6 flex flex-col justify-center">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Welcome!</h1>
        <p className="text-slate-500 mb-8">Let&apos;s get some details before you start ordering.</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input label="Your Name" value={name} onChange={(e) => setName(e.target.value)} required />
          <Input label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} required />
          
          <div>
            <label className="block text-slate-700 font-medium mb-3">Number of Guests</label>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setCovers(Math.max(1, covers - 1))}>-</Button>
              <span className="text-xl font-semibold w-8 text-center">{covers}</span>
              <Button type="button" variant="outline" size="sm" onClick={() => setCovers(Math.min(20, covers + 1))}>+</Button>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button type="submit" className="w-full" size="lg" loading={loading}>
            Explore Menu →
          </Button>
        </form>
      </div>
    </PageTransition>
  );
}
