import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ForgotPasswordPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Şifremi Unuttum</CardTitle>
          <CardDescription>E-posta adresini gir, sana bir sıfırlama bağlantısı gönderelim.</CardDescription>
        </CardHeader>
        <CardContent>
          <ForgotPasswordForm />
        </CardContent>
      </Card>
      <p className="mt-6 text-sm text-muted-foreground">
        Şifreni hatırladın mı?{" "}
        <Link href="/giris" className="font-medium text-primary hover:underline">
          Giriş yap
        </Link>
      </p>
    </div>
  );
}
