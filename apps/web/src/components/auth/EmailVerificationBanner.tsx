"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function EmailVerificationBanner() {
  const user = useAuthStore((s) => s.user);
  const [sent, setSent] = useState(false);
  const resendMutation = trpc.auth.resendVerificationEmail.useMutation();

  if (!user || user.isEmailVerified) {
    return null;
  }

  async function handleResend() {
    await resendMutation.mutateAsync();
    setSent(true);
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
        <span>
          {sent
            ? "Doğrulama e-postası tekrar gönderildi, gelen kutunu kontrol et."
            : "E-posta adresini henüz doğrulamadın."}
        </span>
        {!sent && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={resendMutation.isLoading}
            onClick={handleResend}
          >
            {resendMutation.isLoading ? "Gönderiliyor..." : "Doğrulama e-postasını tekrar gönder"}
          </Button>
        )}
      </AlertDescription>
    </Alert>
  );
}
