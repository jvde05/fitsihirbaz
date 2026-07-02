"use client";

import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";

export default function DiyetisyenLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="DIETITIAN">
      <div>
        <nav className="mb-6 flex gap-4 border-b border-gray-200 pb-3 text-sm">
          <Link href="/diyetisyen/danisanlar" className="font-medium text-brand-700 hover:underline">
            Danışanlarım
          </Link>
          <Link href="/diyetisyen/paketler" className="font-medium text-brand-700 hover:underline">
            Paketlerim
          </Link>
          <Link href="/diyetisyen/randevular" className="font-medium text-brand-700 hover:underline">
            Randevularım
          </Link>
          <Link href="/diyetisyen/mesajlar" className="font-medium text-brand-700 hover:underline">
            Mesajlar
          </Link>
          <Link href="/diyetisyen/icerik" className="font-medium text-brand-700 hover:underline">
            İçerik
          </Link>
          <Link href="/diyetisyen/profil" className="font-medium text-brand-700 hover:underline">
            Profilim
          </Link>
        </nav>
        {children}
      </div>
    </RequireRole>
  );
}
