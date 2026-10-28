"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { getErrorMessage } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useSessionStore } from "@/stores/useSessionStore";
import { PageTransition } from "@/components/shared/PageTransition";
import { Button } from "@/components/ui/Button";

export default function WelcomePage() {
  const router = useRouter();
  const {
    restaurant,
    table,
    session,
    contextType,
    serviceAvailable,
    guestToken,
    updateToken,
    updateSession,
  } = useSessionStore();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (!restaurant || !table)
    return (
      <main className="min-h-dvh grid place-items-center bg-slate-950 p-6 text-slate-300">
        Scan your room or table QR to begin.
      </main>
    );
  const room = contextType === "ROOM_SERVICE";
  return (
    <PageTransition>
      <main className="relative isolate min-h-dvh overflow-hidden bg-slate-950 px-5 py-8 text-white flex items-center justify-center">
        {restaurant.cover_image && (
          <Image
            unoptimized
            src={restaurant.cover_image}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-20 -z-10"
            priority
          />
        )}
        <div className="pointer-events-none absolute -z-10 inset-0 bg-gradient-to-b from-slate-950/20 via-slate-950/70 to-slate-950" />
        <section className="w-full max-w-md py-8 text-center">
          <div className="mx-auto mb-8 grid h-24 w-24 place-items-center overflow-hidden rounded-3xl border border-white/15 bg-white p-3 shadow-xl">
            <Image
              unoptimized
              src={restaurant.logo || "/logo.png"}
              alt={restaurant.hotel_name || restaurant.name}
              width={96}
              height={96}
              className="h-full w-full object-contain"
            />
          </div>
          <p className="inline-flex rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm text-amber-300">
            {room ? "Room" : "Table"} {table.number}
          </p>
          <h1 className="mt-6 text-3xl sm:text-4xl font-semibold tracking-tight break-words">
            {session?.guest_name
              ? `Welcome, ${session.guest_name}`
              : room
                ? "Make yourself at home"
                : "A seat at our table"}
          </h1>
          <p className="mt-3 text-lg text-white/90 break-words">
            {restaurant.hotel_name || restaurant.name}
          </p>
          <p className="mt-5 mx-auto max-w-sm text-sm leading-6 text-slate-300 break-words">
            {restaurant.welcome_message || "Freshly prepared, just for you."}
          </p>
          {restaurant.service_instructions && (
            <details className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm">
              <summary className="cursor-pointer font-medium">
                Service details
              </summary>
              <p className="mt-3 leading-6 text-slate-300 whitespace-pre-wrap">
                {restaurant.service_instructions}
              </p>
            </details>
          )}
          <div className="mt-9 space-y-3">
            <Button
              className="w-full min-h-14 rounded-2xl bg-amber-400 text-slate-950 hover:bg-amber-300"
              disabled={!serviceAvailable && !session}
              loading={busy}
              onClick={async () => {
                if (busy) return;
                if (
                  room &&
                  session &&
                  !["OPEN", "BILL_REQUESTED"].includes(session.status) &&
                  guestToken
                ) {
                  setBusy(true);
                  setError("");
                  try {
                    const result =
                      await api.startVerifiedRoomSession(guestToken);
                    updateToken(result.guest_token);
                    updateSession(result.session);
                    router.push("/menu");
                  } catch (failure) {
                    setError(
                      getErrorMessage(
                        failure,
                        "Could not resume this stay. Scan the room code again.",
                      ),
                    );
                  } finally {
                    setBusy(false);
                  }
                } else
                  router.push(
                    session
                      ? session.status === "OPEN"
                        ? "/menu"
                        : "/tracking"
                      : "/register",
                  );
              }}
            >
              {!serviceAvailable && !session
                ? "Room service is paused"
                : session
                  ? "Continue"
                  : room
                    ? "Order to your room"
                    : "Explore the menu"}
            </Button>
            {room && !session && (
              <button
                onClick={() => router.push("/menu")}
                className="w-full py-3 text-sm text-slate-300"
              >
                Browse menu
              </button>
            )}
            {error && (
              <p role="alert" className="text-sm text-rose-300">
                {error}
              </p>
            )}
            {!serviceAvailable && (
              <p className="text-sm text-slate-300">
                Please contact reception for help.
              </p>
            )}
          </div>
        </section>
      </main>
    </PageTransition>
  );
}
