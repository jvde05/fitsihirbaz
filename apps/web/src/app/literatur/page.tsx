"use client";

import { useState } from "react";
import Link from "next/link";
import { trpc } from "@/lib/trpc";

const PAGE_SIZE = 20;

export default function LiteraturPage() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const articlesQuery = trpc.articles.list.useQuery({ limit });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Literatür</h1>

      {articlesQuery.isLoading && <p className="text-gray-500">Yükleniyor...</p>}
      {articlesQuery.data && articlesQuery.data.items.length === 0 && (
        <p className="text-gray-500">Henüz yayınlanmış bir makale yok.</p>
      )}

      <div className="space-y-4">
        {articlesQuery.data?.items.map((article) => (
          <Link
            key={article.id}
            href={`/literatur/${article.slug}`}
            className="block rounded-md border border-gray-200 p-4 hover:border-brand-500 hover:shadow-sm"
          >
            <p className="font-medium text-gray-900">{article.title}</p>
            <p className="text-sm text-gray-500">
              {article.authorFirstName} {article.authorLastName}
              {article.publishedAt && ` · ${new Date(article.publishedAt).toLocaleDateString("tr-TR")}`}
            </p>
            {article.tags.length > 0 && (
              <p className="mt-1 text-xs text-gray-400">{article.tags.join(", ")}</p>
            )}
          </Link>
        ))}
      </div>

      {articlesQuery.data && articlesQuery.data.items.length < articlesQuery.data.total && (
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
