import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function RegisterPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Kayıt Ol</h1>
      <RegisterForm />
      <p className="mt-4 text-sm text-gray-600">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-brand-700 hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
