"use client";

import { RequireRole } from "@/components/auth/RequireRole";
import { EmailVerificationBanner } from "@/components/auth/EmailVerificationBanner";
import { DashboardNav } from "@/components/layout/DashboardNav";

const NAV_ITEMS = [
  { href: "/diyetisyen/panel", label: "Panelim" },
  { href: "/diyetisyen/danisanlar", label: "Danışanlarım" },
  { href: "/diyetisyen/paketler", label: "Paketlerim" },
  { href: "/diyetisyen/siparisler", label: "Siparişlerim" },
  { href: "/diyetisyen/tarifler", label: "Tariflerim" },
  { href: "/diyetisyen/randevular", label: "Randevularım" },
  { href: "/diyetisyen/mesajlar", label: "Mesajlar" },
  { href: "/diyetisyen/icerik", label: "İçerik" },
  { href: "/diyetisyen/profil", label: "Profilim" },
] as const;

export default function DiyetisyenLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="DIETITIAN">
      <div>
        <DashboardNav items={NAV_ITEMS} />
        <EmailVerificationBanner />
        {children}
      </div>
    </RequireRole>
  );
}
