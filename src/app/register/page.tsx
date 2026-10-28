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
  const {
    guestToken,
    restaurant,
    table,
    updateToken,
    canStartSession,
    contextType,
    updateSession,
  } = useSessionStore();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [covers, setCovers] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestToken) return;

    const guestName = name.trim();
    const guestPhone = phone.trim();
    const guestEmail = email.trim();
    if (!guestName || !guestPhone) {
      setError("Please enter your name and phone number.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await api.startSession(
        guestToken,
        covers,
        guestName,
        guestPhone,
        guestEmail || undefined,
      );
      updateToken(res.guest_token);
      const state = await api.getSessionStatus();
      updateSession(state.session);
      router.push("/menu");
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Something went wrong."));
    } finally {
      setLoading(false);
    }
  };

  if (contextType === "ROOM_SERVICE") return <RoomRegistration />;
  if (!restaurant || !table) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">
        Preparing your table...
      </div>
    );
  }

  if (!canStartSession) {
    return (
      <div className="min-h-screen bg-slate-900 p-6 flex items-center justify-center text-center text-slate-50">
        <div className="max-w-sm rounded-3xl border border-slate-700 bg-slate-800/50 p-8">
          <h1 className="text-2xl font-bold mb-3">This table is in use</h1>
          <p className="text-slate-400">
            Please ask a team member for help if you need to join the current
            order.
          </p>
        </div>
      </div>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-slate-900 text-slate-50 p-6 flex flex-col justify-center relative overflow-hidden">
        {/* Abstract Background */}
        <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="mb-8">
            <p className="text-amber-400 font-semibold mb-2">
              {restaurant.name} · Table {table.number}
            </p>
            <h1 className="text-4xl font-extrabold text-white mb-3">
              Welcome!
            </h1>
            <p className="text-slate-400 text-lg">
              {restaurant.welcome_message ||
                "Please share your details before selecting your items."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="bg-slate-800/50 p-6 rounded-3xl border border-slate-700/50 backdrop-blur-md space-y-6">
              <Input
                label="Your Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoComplete="name"
                maxLength={100}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                autoComplete="tel"
                inputMode="tel"
                maxLength={20}
                required
              />
              <Input
                label="Email Address (Optional)"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                maxLength={254}
              />

              <div>
                <label className="block text-slate-300 font-medium mb-3">
                  Number of Guests
                </label>
                <div className="flex items-center gap-4 bg-slate-900 p-2 rounded-2xl border border-slate-700">
                  <Button
                    type="button"
                    variant="outline"
                    className="w-12 h-12 rounded-xl bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    onClick={() => setCovers(Math.max(1, covers - 1))}
                  >
                    -
                  </Button>
                  <span className="text-2xl font-bold flex-1 text-center text-white">
                    {covers}
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-12 h-12 rounded-xl bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                    onClick={() => setCovers(Math.min(20, covers + 1))}
                  >
                    +
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-sm font-medium px-2">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full text-lg py-5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all"
              loading={loading}
            >
              Continue to Menu →
            </Button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}

function RoomRegistration() {
  const router = useRouter();
  const {
    guestToken,
    restaurant,
    table,
    updateToken,
    updateSession,
    serviceAvailable,
  } = useSessionStore();
  const [phone, setPhone] = useState("+91");
  const [challenge, setChallenge] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!guestToken || !restaurant || !table)
    return (
      <div className="min-h-dvh grid place-items-center p-6">
        Scan the room QR to begin.
      </div>
    );
  return (
    <PageTransition>
      <main className="min-h-dvh bg-slate-950 px-5 py-10 text-white grid place-items-center">
        <div className="w-full max-w-sm">
          <button
            onClick={() => router.replace("/welcome")}
            className="mb-8 text-sm text-slate-300"
          >
            ← Back
          </button>
          <p className="text-amber-400 text-sm font-semibold">
            {restaurant.hotel_name || restaurant.name} · Room {table.number}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">
            {challenge ? "Check your phone" : "Welcome to room service"}
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            {challenge
              ? "If your mobile matches this stay, we’ve sent a verification code."
              : "Use the mobile number registered for your stay."}
          </p>
          {!serviceAvailable ? (
            <p className="mt-6 rounded-2xl bg-white/5 p-5">
              Room service is paused. Please contact reception.
            </p>
          ) : (
            <form
              className="mt-7 space-y-5"
              onSubmit={async (event) => {
                event.preventDefault();
                if (busy) return;
                setBusy(true);
                setError("");
                try {
                  if (!challenge) {
                    const sent = await api.requestRoomVerification(
                      guestToken,
                      phone.trim(),
                    );
                    setChallenge(sent.challenge);
                  } else {
                    const result = await api.verifyRoom(
                      guestToken,
                      challenge,
                      otp.trim(),
                    );
                    updateToken(result.guest_token);
                    updateSession(result.session);
                    router.replace("/welcome");
                  }
                } catch (failure) {
                  setError(
                    getErrorMessage(
                      failure,
                      "Verification failed. Please try again.",
                    ),
                  );
                } finally {
                  setBusy(false);
                }
              }}
            >
              {!challenge ? (
                <Input
                  label="Registered mobile"
                  type="tel"
                  autoComplete="tel"
                  inputMode="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={20}
                  required
                />
              ) : (
                <Input
                  label="Verification code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  minLength={4}
                  maxLength={6}
                  required
                />
              )}
              {error && (
                <p role="alert" className="text-sm text-rose-300">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                loading={busy}
                disabled={busy}
                className="w-full min-h-12"
              >
                {challenge ? "Verify & continue" : "Send code"}
              </Button>
              {challenge && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setChallenge("");
                    setOtp("");
                    setError("");
                  }}
                  className="w-full py-3 text-sm text-slate-300"
                >
                  Change number / resend
                </button>
              )}
            </form>
          )}
          <p className="mt-7 text-xs leading-5 text-slate-400">
            Need help? Reception can check your registered details or take your
            order.
          </p>
        </div>
      </main>
    </PageTransition>
  );
}
