import Link from "next/link";
import { LoginForm } from "@/components/auth/LoginForm";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Giriş Yap</CardTitle>
          <CardDescription>Hesabına giriş yap ve devam et.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
      <p className="mt-6 text-sm text-muted-foreground">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium text-primary hover:underline">
          Kayıt ol
        </Link>
      </p>
    </div>
  );
}
