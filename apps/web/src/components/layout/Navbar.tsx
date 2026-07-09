"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { resolveAvatarUrl } from "@/components/profile/AvatarUploader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

  const avatarUrl = user ? resolveAvatarUrl(user.avatarUrl) : null;

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight text-primary">
          Fit Sihirbaz
        </Link>
        <div className="flex items-center gap-1 text-sm">
          {status === "authenticated" && (
            <Button asChild variant="ghost" size="sm">
              <Link href="/akis">Akış</Link>
            </Button>
          )}
          <Button asChild variant="ghost" size="sm">
            <Link href="/diyetisyenler">Diyetisyenler</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/literatur">Literatür</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/referans-degerleri">Referans Değerleri</Link>
          </Button>

          {status === "authenticated" && user ? (
            <div className="ml-2 flex items-center gap-3 border-l pl-3">
              <NotificationBell />
              <Link
                href={PROFILE_HREFS[user.role] ?? "/"}
                className="flex items-center gap-2 text-foreground/80 hover:text-foreground"
              >
                <Avatar className="h-7 w-7">
                  {avatarUrl && <AvatarImage src={avatarUrl} alt="" />}
                  <AvatarFallback className="text-xs">
                    {user.firstName?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden sm:inline">
                  {user.firstName} ({ROLE_LABELS[user.role] ?? user.role})
                </span>
              </Link>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Çıkış Yap
              </Button>
            </div>
          ) : (
            <div className="ml-2 flex items-center gap-2 border-l pl-3">
              <Button asChild variant="ghost" size="sm">
                <Link href="/giris">Giriş</Link>
              </Button>
              <Button asChild size="sm">
                <Link href="/kayit">Kayıt Ol</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
