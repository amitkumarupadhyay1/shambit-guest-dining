import { API_BASE_URL } from "./constants";
import type { ScanResponse, BillSummary } from "@/types";

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const guestToken =
    typeof window !== "undefined" ? localStorage.getItem("guest_token") : null;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (guestToken) {
    headers["X-Guest-Token"] = guestToken;
  }
  const res = await fetch(`${API_BASE_URL}/restaurants/${endpoint}`, {
    ...options,
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  scan: (code: string) =>
    request<ScanResponse>("public/guest-dining/scan/", {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  startSession: (
    guestToken: string,
    covers: number,
    guestName: string,
    guestPhone: string,
    guestEmail?: string,
  ) =>
    request<{ detail: string; session_id: number; guest_token: string }>(
      "public/guest-dining/start-session/",
      {
        method: "POST",
        body: JSON.stringify({
          guest_token: guestToken,
          covers,
          guest_name: guestName,
          guest_phone: guestPhone,
          guest_email: guestEmail,
        }),
      },
    ),

  placeOrder: (
    guestToken: string,
    clientOrderKey: string,
    items: { menu_item: number; quantity: number; notes?: string }[],
  ) =>
    request<{ id: number }>("public/guest-dining/orders/", {
      method: "POST",
      body: JSON.stringify({
        guest_token: guestToken,
        client_order_key: clientOrderKey,
        items,
      }),
    }),

  quoteOrder: (
    guestToken: string,
    items: { menu_item: number; quantity: number }[],
  ) =>
    request<{ subtotal: string; grand_total: string; final_bill_note: string }>(
      "public/guest-dining/orders/quote/",
      {
        method: "POST",
        body: JSON.stringify({ guest_token: guestToken, items }),
      },
    ),

  verifyCaptcha: (guestToken: string, orderId: number, captchaCode: string) =>
    request<{ detail: string; order_id: number }>(
      "public/guest-dining/orders/verify-captcha/",
      {
        method: "POST",
        body: JSON.stringify({
          guest_token: guestToken,
          order_id: orderId,
          captcha_code: captchaCode,
        }),
      },
    ),

  getSessionStatus: () =>
    request<{ session: import("@/types").Session }>(
      "public/guest-dining/session/status/",
    ),

  requestBill: (guestToken: string, paymentMethod?: string) =>
    request<{ detail: string; session_id: number }>(
      "public/guest-dining/request-bill/",
      {
        method: "POST",
        body: JSON.stringify({
          guest_token: guestToken,
          payment_method: paymentMethod,
        }),
      },
    ),

  callCaptain: (guestToken: string) =>
    request<{ detail: string }>("public/guest-dining/call-waiter/", {
      method: "POST",
      body: JSON.stringify({ guest_token: guestToken }),
    }),

  getBillSummary: () =>
    request<BillSummary>("public/guest-dining/bill/summary/"),

  submitFeedback: (data: {
    food_rating: number;
    service_rating?: number;
    ambience_rating?: number;
    comment?: string;
  }) =>
    request<{ detail: string; id: number }>("public/guest-dining/feedback/", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  getBillDownloadUrl: () => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("guest_token") : "";
    return `${API_BASE_URL}/restaurants/public/guest-dining/bill/download/?token=${token}`;
  },
};
