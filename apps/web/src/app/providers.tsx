"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { SessionBootstrap } from "@/components/auth/SessionBootstrap";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/trpc`,
          fetch(url, options) {
            return fetch(url, { ...options, credentials: "include" });
          },
          headers() {
            const accessToken = useAuthStore.getState().accessToken;
            return accessToken ? { authorization: `Bearer ${accessToken}` } : {};
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <SessionBootstrap>{children}</SessionBootstrap>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
