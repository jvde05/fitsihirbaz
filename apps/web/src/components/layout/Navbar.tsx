"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { NotificationBell } from "./NotificationBell";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

export function Navbar() {
  const router = useRouter();
  const { status, user, clearSession } = useAuthStore();
  const logoutMutation = trpc.auth.logout.useMutation();

  async function handleLogout() {
    await logoutMutation.mutateAsync();
    clearSession();
    router.push("/");
  }

  return (
    <header className="border-b border-gray-200 bg-white">
      <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-brand-700">
          Fit Sihirbaz
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {status === "authenticated" && (
            <Link href="/akis" className="text-gray-600 hover:text-gray-900">
              Akış
            </Link>
          )}
          <Link href="/diyetisyenler" className="text-gray-600 hover:text-gray-900">
            Diyetisyenler
          </Link>
          <Link href="/literatur" className="text-gray-600 hover:text-gray-900">
            Literatür
          </Link>
          <Link href="/referans-degerleri" className="text-gray-600 hover:text-gray-900">
            Referans Değerleri
          </Link>
          {status === "authenticated" && user ? (
            <div className="flex items-center gap-3">
              <NotificationBell />
              <span className="text-gray-700">
                {user.firstName} ({ROLE_LABELS[user.role] ?? user.role})
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-gray-700 hover:bg-gray-100"
              >
                Çıkış Yap
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/giris" className="text-gray-600 hover:text-gray-900">
                Giriş
              </Link>
              <Link
                href="/kayit"
                className="rounded-md bg-brand-600 px-3 py-1.5 text-white hover:bg-brand-700"
              >
                Kayıt Ol
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
