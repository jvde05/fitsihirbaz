"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

const PAGE_SIZE = 20;

export default function DiyetisyenlerPage() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const searchQuery = trpc.dietitians.search.useQuery({ query: query || undefined, limit });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Diyetisyenler</h1>

      <input
        type="text"
        placeholder="İsim veya uzmanlık ara..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setLimit(PAGE_SIZE);
        }}
        className="mb-6 w-full max-w-md rounded-md border border-gray-300 px-3 py-2"
      />

      {searchQuery.isLoading && <p className="text-gray-500">Yükleniyor...</p>}
      {searchQuery.isError && (
        <QueryErrorNotice message={searchQuery.error.message} onRetry={() => searchQuery.refetch()} />
      )}
      {searchQuery.data && searchQuery.data.items.length === 0 && (
        <p className="text-gray-500">Sonuç bulunamadı.</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {searchQuery.data?.items.map((dietitian) => (
          <Link
            key={dietitian.id}
            href={`/diyetisyenler/${dietitian.id}`}
            className="rounded-md border border-gray-200 p-4 hover:border-brand-500 hover:shadow-sm"
          >
            <p className="font-medium text-gray-900">
              {dietitian.firstName} {dietitian.lastName}
              {dietitian.verificationStatus === "VERIFIED" && (
                <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-xs text-brand-700">
                  Onaylı
                </span>
              )}
            </p>
            {dietitian.title && <p className="text-sm text-gray-500">{dietitian.title}</p>}
            {dietitian.specialties.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">{dietitian.specialties.join(", ")}</p>
            )}
            {dietitian.averageRating !== null && (
              <p className="mt-2 text-sm text-gray-600">★ {dietitian.averageRating.toFixed(1)}</p>
            )}
          </Link>
        ))}
      </div>

      {searchQuery.data && searchQuery.data.items.length < searchQuery.data.total && (
        <button
          type="button"
          onClick={() => setLimit((current) => current + PAGE_SIZE)}
          className="mt-6 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Daha Fazla Yükle
        </button>
      )}
    </div>
  );
}
