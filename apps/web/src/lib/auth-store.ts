import { create } from "zustand";
import type { PublicUser } from "@fit-sihirbaz/shared";

export type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthState {
  status: AuthStatus;
  user: PublicUser | null;
  accessToken: string | null;
  setLoading: () => void;
  setSession: (user: PublicUser, accessToken: string) => void;
  clearSession: () => void;
}

// Access token yalnızca bellekte tutulur (sayfa yenilendiğinde auth.refresh ile
// httpOnly refresh cookie üzerinden tekrar alınır) — WEB.md'deki auth stratejisi.
export const useAuthStore = create<AuthState>((set) => ({
  status: "idle",
  user: null,
  accessToken: null,
  setLoading: () => set({ status: "loading" }),
  setSession: (user, accessToken) => set({ status: "authenticated", user, accessToken }),
  clearSession: () => set({ status: "unauthenticated", user: null, accessToken: null }),
}));
