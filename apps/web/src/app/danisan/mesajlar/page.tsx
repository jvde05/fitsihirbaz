"use client";

import { trpc } from "@/lib/trpc";
import { MessagesPage } from "@/components/messages/MessagesPage";

export default function DanisanMesajlarPage() {
  const dietitiansQuery = trpc.clients.getMyDietitians.useQuery();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Mesajlar</h1>
      <MessagesPage counterparts={dietitiansQuery.data ?? []} />
    </div>
  );
}
