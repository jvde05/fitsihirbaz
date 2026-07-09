"use client";

import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardNav } from "@/components/layout/DashboardNav";

const NAV_ITEMS = [
  { href: "/admin/diyetisyenler", label: "Diyetisyenler" },
  { href: "/admin/besinler", label: "Besinler" },
  { href: "/admin/kaynaklar", label: "Besin Kaynakçası" },
  { href: "/admin/kullanicilar", label: "Kullanıcılar" },
  { href: "/admin/icerik", label: "İçerik / Literatür" },
  { href: "/admin/referans-degerleri", label: "Referans Değerleri" },
  { href: "/admin/profil", label: "Profilim" },
] as const;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="ADMIN">
      <div>
        <DashboardNav items={NAV_ITEMS} />
        {children}
      </div>
    </RequireRole>
  );
}
