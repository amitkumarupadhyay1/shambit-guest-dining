import { beforeEach, expect, it, vi } from "vitest";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  cleanup,
} from "@testing-library/react";
import { useSessionStore } from "@/stores/useSessionStore";
import { api } from "@/lib/api";
import RegisterPage from "./page";
const replace = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
}));
vi.mock("@/components/shared/PageTransition", () => ({
  PageTransition: ({ children }: { children: React.ReactNode }) => children,
}));
beforeEach(() => {
  cleanup();
  vi.restoreAllMocks();
  replace.mockClear();
  useSessionStore.setState({
    contextType: "ROOM_SERVICE",
    guestToken: "browse",
    restaurant: { id: 1, name: "Garden", hotel_name: "Guest Hotel" } as never,
    table: { id: 7, number: "205" },
    session: null,
    serviceAvailable: true,
  });
});
it("verifies the registered mobile before using the guest identity", async () => {
  vi.spyOn(api, "requestRoomVerification").mockResolvedValue({
    challenge: "challenge",
    detail: "Sent",
  });
  vi.spyOn(api, "verifyRoom").mockResolvedValue({
    guest_token: "verified",
    session: {
      id: 44,
      guest_name: "Room guest",
      status: "OPEN",
      requested_payment_method: null,
      active_orders: [],
    },
  });
  render(<RegisterPage />);
  expect(screen.queryByText("Room guest")).toBeNull();
  fireEvent.change(screen.getByLabelText("Registered mobile"), {
    target: { value: "+919876543210" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Send code" }));
  await screen.findByLabelText("Verification code");
  expect(api.requestRoomVerification).toHaveBeenCalledWith(
    "browse",
    "+919876543210",
  );
  fireEvent.change(screen.getByLabelText("Verification code"), {
    target: { value: "123456" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Verify & continue" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/welcome"));
  expect(useSessionStore.getState().session?.guest_name).toBe("Room guest");
  expect(localStorage.getItem("guest_token")).toBe("verified");
});
it("shows verification errors without falsely starting an order session", async () => {
  vi.spyOn(api, "requestRoomVerification").mockRejectedValue(
    new Error("Please retry in a minute."),
  );
  render(<RegisterPage />);
  fireEvent.click(screen.getByRole("button", { name: "Send code" }));
  await screen.findByRole("alert");
  expect(useSessionStore.getState().session).toBeNull();
  expect(screen.getByRole("alert").textContent).toContain("retry");
});
