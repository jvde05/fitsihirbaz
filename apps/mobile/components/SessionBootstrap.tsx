import { useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { clearStoredRefreshToken, getStoredRefreshToken, setStoredRefreshToken } from "@/lib/secure-store";

// Uygulama açılışında secure-store'daki refresh token ile sessiz oturum yenileme dener
// (web'deki httpOnly cookie tabanlı SessionBootstrap'ın mobil karşılığı).
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
        const storedRefreshToken = await getStoredRefreshToken();
        if (!storedRefreshToken) {
          clearSession();
          return;
        }
        const tokens = await utils.client.auth.refresh.mutate({ refreshToken: storedRefreshToken });
        await setStoredRefreshToken(tokens.refreshToken);
        useAuthStore.setState({ accessToken: tokens.accessToken });
        const user = await utils.client.auth.me.query();
        setSession(user, tokens.accessToken);
      } catch {
        await clearStoredRefreshToken();
        clearSession();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <>{children}</>;
}
