"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export interface DashboardNavItem {
  href: string;
  label: string;
}

export function DashboardNav({ items }: { items: readonly DashboardNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="mb-8 flex flex-wrap gap-x-1 gap-y-2 border-b text-sm">
      {items.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-3 py-2.5 font-medium transition-colors",
              isActive
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
