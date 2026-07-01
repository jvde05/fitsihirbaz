"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";

export default function LiteraturDetayPage() {
  const params = useParams<{ slug: string }>();
  const articleQuery = trpc.articles.getBySlug.useQuery({ slug: params.slug });

  if (articleQuery.isLoading) {
    return <p className="text-gray-500">Yükleniyor...</p>;
  }
  if (!articleQuery.data) {
    return <p className="text-gray-500">Makale bulunamadı.</p>;
  }

  const article = articleQuery.data;

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">{article.title}</h1>
      <p className="mb-6 text-sm text-gray-500">
        {article.authorFirstName} {article.authorLastName}
        {article.publishedAt && ` · ${new Date(article.publishedAt).toLocaleDateString("tr-TR")}`}
      </p>
      <div className="whitespace-pre-line text-gray-700">{article.body}</div>

      {article.sourceCitations.length > 0 && (
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="mb-2 text-sm font-medium text-gray-700">Kaynaklar</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-gray-500">
            {article.sourceCitations.map((citation) => (
              <li key={citation}>{citation}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
