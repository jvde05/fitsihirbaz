"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function VerifyEmailStatus() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [state, setState] = useState<"loading" | "success" | "error">(token ? "loading" : "error");
  const attempted = useRef(false);
  const utils = trpc.useUtils();
  const { accessToken, setSession } = useAuthStore();

  useEffect(() => {
    if (!token || attempted.current) return;
    attempted.current = true;

    (async () => {
      try {
        await utils.client.auth.verifyEmail.mutate({ token });
        setState("success");
        // Aktif bir oturum varsa banner'ın kaybolması için store'daki kullanıcıyı tazele.
        if (accessToken) {
          const user = await utils.client.auth.me.query();
          setSession(user, accessToken);
        }
      } catch {
        setState("error");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (state === "loading") {
    return <p className="text-center text-muted-foreground">Doğrulanıyor...</p>;
  }

  if (state === "error") {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          Bağlantı geçersiz veya süresi dolmuş. Panelinden yeni bir doğrulama e-postası isteyebilirsin.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert>
      <AlertDescription>
        E-posta adresin doğrulandı.{" "}
        <Link href="/" className="font-medium text-primary hover:underline">
          Devam et
        </Link>
      </AlertDescription>
    </Alert>
  );
}
