"use client";

import { trpc } from "@/lib/trpc";

export default function AdminIcerikPage() {
  const utils = trpc.useUtils();
  const articlesQuery = trpc.articles.listAll.useQuery();

  const publishMutation = trpc.articles.publish.useMutation({
    onSuccess: () => utils.articles.listAll.invalidate(),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">İçerik / Literatür Yönetimi</h1>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {articlesQuery.data?.map((article) => (
          <li key={article.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">
                {article.title}{" "}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    article.publishedAt ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {article.publishedAt ? "Yayında" : "Taslak"}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                /{article.slug} · {article.authorFirstName} {article.authorLastName}
              </p>
            </div>
            {!article.publishedAt && (
              <button
                type="button"
                onClick={() => publishMutation.mutate({ id: article.id })}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
              >
                Yayınla
              </button>
            )}
          </li>
        ))}
      </ul>
      {articlesQuery.data?.length === 0 && <p className="text-gray-500">Henüz makale yok.</p>}
    </div>
  );
}
