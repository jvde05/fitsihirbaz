"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/auth-store";

// RequireRole'ün rol'e bakmaksızın (herhangi bir giriş yapmış kullanıcı) versiyonu —
// besin detayı gibi tüm rollerin erişebildiği sayfalar için.
export function RequireAuth({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuthStore();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/giris");
    }
  }, [status, router]);

  if (status === "idle" || status === "loading") {
    return <div className="py-16 text-center text-muted-foreground">Yükleniyor...</div>;
  }
  if (status !== "authenticated") {
    return null;
  }
  return <>{children}</>;
}
