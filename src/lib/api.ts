import { useSessionStore } from "@/stores/useSessionStore";
import { API_BASE_URL } from "./constants";
import type { ScanResponse, BillSummary, Session } from "@/types";

export class GuestApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public details: Record<string, unknown> = {},
  ) {
    super(message);
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const guestToken = useSessionStore.getState().guestToken;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (guestToken) {
    headers["X-Guest-Token"] = guestToken;
  }
  const res = await fetch(`${API_BASE_URL}/restaurants/${endpoint}`, {
    ...options,
    cache: "no-store",
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const fields =
      body.details && typeof body.details === "object" ? body.details : body;
    const message =
      fields.detail ||
      fields.possible_duplicate?.message ||
      body.error ||
      body.detail ||
      Object.entries(fields)
        .map(
          ([field, value]) =>
            `${field}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
        )
        .join(" ");
    throw new GuestApiError(
      message || "Could not connect. Please try again.",
      res.status,
      fields,
    );
  }
  return res.json();
}

export interface GuestOrderItem {
  menu_item: number;
  quantity: number;
  variant?: number | null;
  selected_modifiers?: { modifier_ids: number[] };
  notes?: string;
}
export interface GuestQuote {
  quote_token: string;
  subtotal: string;
  tax_total: string;
  grand_total: string;
  final_bill_note: string;
  taxes: Array<{ name: string; amount: string }>;
  items: Array<{ menu_item: number; unit_price: string; line_total: string }>;
}

export const api = {
  startVerifiedRoomSession: (guestToken: string) =>
    request<{ guest_token: string; session: Session }>(
      "public/guest-dining/start-session/",
      { method: "POST", body: JSON.stringify({ guest_token: guestToken }) },
    ),
  requestRoomVerification: (guestToken: string, phone: string) =>
    request<{ challenge: string; detail: string }>(
      "public/guest-dining/start-session/",
      {
        method: "POST",
        body: JSON.stringify({ guest_token: guestToken, phone }),
      },
    ),
  verifyRoom: (guestToken: string, challenge: string, otp: string) =>
    request<{ guest_token: string; session: Session }>(
      "public/guest-dining/start-session/",
      {
        method: "POST",
        body: JSON.stringify({ guest_token: guestToken, challenge, otp }),
      },
    ),
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
    items: GuestOrderItem[],
    allowPossibleDuplicate = false,
    quoteToken?: string,
  ) =>
    request<{ id: number }>("public/guest-dining/orders/", {
      method: "POST",
      body: JSON.stringify({
        guest_token: guestToken,
        client_order_key: clientOrderKey,
        allow_possible_duplicate: allowPossibleDuplicate,
        quote_token: quoteToken,
        items,
      }),
    }),

  quoteOrder: (guestToken: string, items: GuestOrderItem[]) =>
    request<GuestQuote>("public/guest-dining/orders/quote/", {
      method: "POST",
      body: JSON.stringify({ guest_token: guestToken, items }),
    }),

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
    const token = useSessionStore.getState().guestToken;
    return `${API_BASE_URL}/restaurants/public/guest-dining/bill/download/?token=${encodeURIComponent(token ?? "")}`;
  },
};
