import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Giriş Yap</h1>
      <LoginForm />
      <p className="mt-4 text-sm text-gray-600">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium text-brand-700 hover:underline">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
