"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { Role } from "@fit-sihirbaz/shared";
import { useAuthStore } from "@/lib/auth-store";

export function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const router = useRouter();
  const { status, user } = useAuthStore();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/giris");
    } else if (status === "authenticated" && user && user.role !== role) {
      router.replace("/");
    }
  }, [status, user, role, router]);

  if (status === "idle" || status === "loading") {
    return <div className="py-16 text-center text-muted-foreground">Yükleniyor...</div>;
  }
  if (status !== "authenticated" || !user || user.role !== role) {
    return null;
  }
  return <>{children}</>;
}
