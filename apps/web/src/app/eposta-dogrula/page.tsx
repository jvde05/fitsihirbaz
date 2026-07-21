import { Suspense } from "react";
import { VerifyEmailStatus } from "@/components/auth/VerifyEmailStatus";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function VerifyEmailPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center py-8">
      <Card className="w-full">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">E-posta Doğrulama</CardTitle>
          <CardDescription>E-posta adresin doğrulanıyor.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<p className="text-center text-muted-foreground">Yükleniyor...</p>}>
            <VerifyEmailStatus />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
