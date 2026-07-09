"use client";

import { trpc } from "@/lib/trpc";
import { MessagesPage } from "@/components/messages/MessagesPage";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

export default function DanisanMesajlarPage() {
  const dietitiansQuery = trpc.clients.getMyDietitians.useQuery();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Mesajlar</h1>
      {dietitiansQuery.isError && (
        <QueryErrorNotice message={dietitiansQuery.error.message} onRetry={() => dietitiansQuery.refetch()} />
      )}
      <MessagesPage counterparts={dietitiansQuery.data ?? []} />
    </div>
  );
}
