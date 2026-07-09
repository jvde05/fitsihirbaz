"use client";

import { useState } from "react";
import Link from "next/link";
import { BookOpen } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

export default function LiteraturPage() {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const articlesQuery = trpc.articles.list.useQuery({ limit });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Literatür</h1>

      {articlesQuery.isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-lg" />
          ))}
        </div>
      )}
      {articlesQuery.isError && (
        <QueryErrorNotice message={articlesQuery.error.message} onRetry={() => articlesQuery.refetch()} />
      )}
      {articlesQuery.data && articlesQuery.data.items.length === 0 && (
        <EmptyState icon={BookOpen} title="Henüz yayınlanmış bir makale yok" />
      )}

      <div className="space-y-4">
        {articlesQuery.data?.items.map((article) => (
          <Link key={article.id} href={`/literatur/${article.slug}`}>
            <Card className="p-4 transition-shadow hover:shadow-md">
              <p className="font-medium text-foreground">{article.title}</p>
              <p className="text-sm text-muted-foreground">
                {article.authorFirstName} {article.authorLastName}
                {article.publishedAt && ` · ${new Date(article.publishedAt).toLocaleDateString("tr-TR")}`}
              </p>
              {article.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {article.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {articlesQuery.data && articlesQuery.data.items.length < articlesQuery.data.total && (
        <Button variant="outline" className="mt-6" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
          Daha Fazla Yükle
        </Button>
      )}
    </div>
  );
}
