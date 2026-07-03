"use client";

import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="ADMIN">
      <div>
        <nav className="mb-6 flex gap-4 border-b border-gray-200 pb-3 text-sm">
          <Link href="/admin/diyetisyenler" className="font-medium text-brand-700 hover:underline">
            Diyetisyenler
          </Link>
          <Link href="/admin/besinler" className="font-medium text-brand-700 hover:underline">
            Besinler
          </Link>
          <Link href="/admin/kullanicilar" className="font-medium text-brand-700 hover:underline">
            Kullanıcılar
          </Link>
          <Link href="/admin/icerik" className="font-medium text-brand-700 hover:underline">
            İçerik
          </Link>
          <Link href="/admin/referans-degerleri" className="font-medium text-brand-700 hover:underline">
            Referans Değerleri
          </Link>
          <Link href="/admin/profil" className="font-medium text-brand-700 hover:underline">
            Profilim
          </Link>
        </nav>
        {children}
      </div>
    </RequireRole>
  );
}
