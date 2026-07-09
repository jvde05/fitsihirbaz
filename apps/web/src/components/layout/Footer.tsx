import Link from "next/link";
import { Separator } from "@/components/ui/separator";

const PRODUCT_LINKS = [
  { href: "/diyetisyenler", label: "Diyetisyenler" },
  { href: "/literatur", label: "Literatür" },
  { href: "/referans-degerleri", label: "Referans Değerleri" },
];

const ACCOUNT_LINKS = [
  { href: "/giris", label: "Giriş" },
  { href: "/kayit", label: "Kayıt Ol" },
];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-16 border-t bg-muted/30">
      <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="text-lg font-semibold text-primary">Fit Sihirbaz</p>
          <p className="mt-2 max-w-xs text-sm text-muted-foreground">
            Diyetisyenlerin danışanlarını yönettiği, danışanların diyet planlarını ve ilerlemesini takip
            ettiği beslenme platformu.
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Ürün</p>
          <ul className="mt-3 space-y-2">
            {PRODUCT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">Hesap</p>
          <ul className="mt-3 space-y-2">
            {ACCOUNT_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <Separator />
      <p className="px-4 py-4 text-center text-xs text-muted-foreground">
        © {year} Fit Sihirbaz. Tüm hakları saklıdır.
      </p>
    </footer>
  );
}
