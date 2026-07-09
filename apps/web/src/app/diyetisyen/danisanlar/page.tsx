"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function DanisanlarPage() {
  const utils = trpc.useUtils();
  const clientsQuery = trpc.dietitians.getMyClients.useQuery();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const linkMutation = trpc.clients.linkToDietitian.useMutation({
    onSuccess: () => {
      setEmail("");
      setError(null);
      utils.dietitians.getMyClients.invalidate();
    },
    onError: (err) => setError(err.message),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    linkMutation.mutate({ clientEmail: email });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Danışanlarım</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex max-w-md gap-2">
        <Input
          type="email"
          required
          placeholder="Danışan e-postası"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={linkMutation.isLoading}>
          {linkMutation.isLoading ? "Ekleniyor..." : "Ekle"}
        </Button>
      </form>
      {error && <p className="mb-4 text-sm text-destructive">{error}</p>}

      {clientsQuery.isLoading && <p className="text-muted-foreground">Yükleniyor...</p>}
      {clientsQuery.isError && (
        <QueryErrorNotice message={clientsQuery.error.message} onRetry={() => clientsQuery.refetch()} />
      )}
      {clientsQuery.data && clientsQuery.data.length === 0 && (
        <EmptyState title="Henüz danışanınız yok" description="Yukarıdan e-posta ile ekleyebilirsiniz." />
      )}

      <ul className="divide-y rounded-md border">
        {clientsQuery.data?.map((client) => (
          <li key={client.id} className="flex items-center justify-between px-4 py-3">
            <Link href={`/diyetisyen/danisanlar/${client.id}`} className="hover:underline">
              <p className="font-medium text-foreground">
                {client.firstName} {client.lastName}
              </p>
              <p className="text-sm text-muted-foreground">{client.email}</p>
            </Link>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/diyetisyen/danisanlar/${client.id}/plan-olustur`}>Plan Oluştur</Link>
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
