"use client";

import Link from "next/link";
import { RequireRole } from "@/components/auth/RequireRole";

export default function DanisanLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireRole role="CLIENT">
      <div>
        <nav className="mb-6 flex gap-4 border-b border-gray-200 pb-3 text-sm">
          <Link href="/danisan/plan" className="font-medium text-brand-700 hover:underline">
            Diyet Planım
          </Link>
          <Link href="/danisan/ilerleme" className="font-medium text-brand-700 hover:underline">
            İlerleme
          </Link>
          <Link href="/danisan/randevular" className="font-medium text-brand-700 hover:underline">
            Randevularım
          </Link>
          <Link href="/danisan/mesajlar" className="font-medium text-brand-700 hover:underline">
            Mesajlar
          </Link>
        </nav>
        {children}
      </div>
    </RequireRole>
  );
}
