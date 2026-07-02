"use client";

import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

// Sayfa yenilendiğinde httpOnly refresh cookie üzerinden sessiz oturum yenileme dener.
// Not: trpc.auth.me.useQuery({enabled:false}) + refetch() yerine vanilla client kullanılır;
// devre dışı bırakılmış bir query'nin refetch() sonucu React Query'de yarış durumuna yol açabiliyor.
export function SessionBootstrap({ children }: { children: React.ReactNode }) {
  const { setLoading, setSession, clearSession } = useAuthStore();
  const attempted = useRef(false);
  const utils = trpc.useUtils();

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;
    setLoading();

    (async () => {
      try {
        const tokens = await utils.client.auth.refresh.mutate({});
        useAuthStore.setState({ accessToken: tokens.accessToken });
        const user = await utils.client.auth.me.query();
        setSession(user, tokens.accessToken);
      } catch {
        clearSession();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
