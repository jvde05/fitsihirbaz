"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

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
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Danışanlarım</h1>

      <form onSubmit={handleSubmit} className="mb-8 flex max-w-md gap-2">
        <input
          type="email"
          required
          placeholder="Danışan e-postası"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="flex-1 rounded-md border border-gray-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={linkMutation.isLoading}
          className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {linkMutation.isLoading ? "Ekleniyor..." : "Ekle"}
        </button>
      </form>
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {clientsQuery.isLoading && <p className="text-gray-500">Yükleniyor...</p>}
      {clientsQuery.data && clientsQuery.data.length === 0 && (
        <p className="text-gray-500">Henüz danışanınız yok. Yukarıdan e-posta ile ekleyebilirsiniz.</p>
      )}

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {clientsQuery.data?.map((client) => (
          <li key={client.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">
                {client.firstName} {client.lastName}
              </p>
              <p className="text-sm text-gray-500">{client.email}</p>
            </div>
            <Link
              href={`/diyetisyen/danisanlar/${client.id}/plan-olustur`}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              Plan Oluştur
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
