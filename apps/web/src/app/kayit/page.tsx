import Link from "next/link";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Kayıt Ol</CardTitle>
          <CardDescription>Danışan veya diyetisyen olarak ücretsiz hesap oluştur.</CardDescription>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
      <p className="mt-6 text-sm text-muted-foreground">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-primary hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
