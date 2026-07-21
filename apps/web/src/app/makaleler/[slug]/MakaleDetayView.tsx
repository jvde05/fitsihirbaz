"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

export function MakaleDetayView() {
  const params = useParams<{ slug: string }>();
  const articleQuery = trpc.articles.getBySlug.useQuery({ slug: params.slug });

  if (articleQuery.isLoading) {
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }
  if (articleQuery.isError) {
    return <QueryErrorNotice message={articleQuery.error.message} onRetry={() => articleQuery.refetch()} />;
  }
  if (!articleQuery.data) {
    return <p className="text-muted-foreground">Makale bulunamadı.</p>;
  }

  const article = articleQuery.data;

  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">{article.title}</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {article.authorFirstName} {article.authorLastName}
        {article.publishedAt && ` · ${new Date(article.publishedAt).toLocaleDateString("tr-TR")}`}
      </p>
      <div className="whitespace-pre-line text-foreground/90">{article.body}</div>

      {article.sourceCitations.length > 0 && (
        <div className="mt-8 border-t pt-4">
          <p className="mb-2 text-sm font-medium text-foreground">Kaynaklar</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {article.sourceCitations.map((citation) => (
              <li key={citation}>{citation}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
