"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { resolveAvatarUrl } from "@/components/profile/AvatarUploader";
import { NotificationBell } from "./NotificationBell";

const ROLE_LABELS: Record<string, string> = {
  CLIENT: "Danışan",
  DIETITIAN: "Diyetisyen",
  ADMIN: "Yönetici",
};

const PROFILE_HREFS: Record<string, string> = {
  CLIENT: "/danisan/profil",
  DIETITIAN: "/diyetisyen/profil",
  ADMIN: "/admin/profil",
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
              <Link
                href={PROFILE_HREFS[user.role] ?? "/"}
                className="flex items-center gap-2 text-gray-700 hover:text-gray-900"
              >
                <span className="h-7 w-7 overflow-hidden rounded-full bg-gray-100">
                  {resolveAvatarUrl(user.avatarUrl) ? (
                    <img
                      src={resolveAvatarUrl(user.avatarUrl) ?? undefined}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </span>
                {user.firstName} ({ROLE_LABELS[user.role] ?? user.role})
              </Link>
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
