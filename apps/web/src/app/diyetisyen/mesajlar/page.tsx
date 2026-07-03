"use client";

import { trpc } from "@/lib/trpc";
import { MessagesPage } from "@/components/messages/MessagesPage";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

export default function DiyetisyenMesajlarPage() {
  const clientsQuery = trpc.dietitians.getMyClients.useQuery();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Mesajlar</h1>
      {clientsQuery.isError && (
        <QueryErrorNotice message={clientsQuery.error.message} onRetry={() => clientsQuery.refetch()} />
      )}
      <MessagesPage counterparts={clientsQuery.data ?? []} />
    </div>
  );
}
