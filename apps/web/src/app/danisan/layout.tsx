"use client";

import { RequireRole } from "@/components/auth/RequireRole";
import { DashboardNav } from "@/components/layout/DashboardNav";

const NAV_ITEMS = [
  { href: "/danisan/panel", label: "Panelim" },
  { href: "/danisan/plan", label: "Diyet Planım" },
  { href: "/danisan/ilerleme", label: "İlerleme" },
  { href: "/danisan/randevular", label: "Randevularım" },
  { href: "/danisan/mesajlar", label: "Mesajlar" },
  { href: "/danisan/profil", label: "Profilim" },
] as const;

export default function DanisanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="CLIENT">
      <div>
        <DashboardNav items={NAV_ITEMS} />
        {children}
      </div>
    </RequireRole>
  );
}
