"use client";

import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminIcerikPage() {
  const utils = trpc.useUtils();
  const articlesQuery = trpc.articles.listAll.useQuery();

  const publishMutation = trpc.articles.publish.useMutation({
    onSuccess: () => utils.articles.listAll.invalidate(),
  });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Makale Yönetimi</h1>

      {articlesQuery.isError && (
        <QueryErrorNotice message={articlesQuery.error.message} onRetry={() => articlesQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {articlesQuery.data?.map((article) => (
          <li key={article.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{article.title}</p>
                <Badge variant={article.publishedAt ? "success" : "secondary"}>
                  {article.publishedAt ? "Yayında" : "Taslak"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                /{article.slug} · {article.authorFirstName} {article.authorLastName}
              </p>
            </div>
            {!article.publishedAt && (
              <Button size="sm" onClick={() => publishMutation.mutate({ id: article.id })}>
                Yayınla
              </Button>
            )}
          </li>
        ))}
      </ul>
      {articlesQuery.data?.length === 0 && <EmptyState title="Henüz makale yok" />}
    </div>
  );
}
