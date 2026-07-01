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
        </nav>
        {children}
      </div>
    </RequireRole>
  );
}
