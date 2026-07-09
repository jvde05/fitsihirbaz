"use client";

import { useState } from "react";
import Link from "next/link";
import { Star, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const PAGE_SIZE = 20;

export default function DiyetisyenlerPage() {
  const [query, setQuery] = useState("");
  const [limit, setLimit] = useState(PAGE_SIZE);
  const searchQuery = trpc.dietitians.search.useQuery({ query: query || undefined, limit });

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Diyetisyenler</h1>

      <Input
        type="text"
        placeholder="İsim veya uzmanlık ara..."
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setLimit(PAGE_SIZE);
        }}
        className="mb-6 max-w-md"
      />

      {searchQuery.isLoading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-lg" />
          ))}
        </div>
      )}
      {searchQuery.isError && (
        <QueryErrorNotice message={searchQuery.error.message} onRetry={() => searchQuery.refetch()} />
      )}
      {searchQuery.data && searchQuery.data.items.length === 0 && (
        <EmptyState icon={Users} title="Sonuç bulunamadı" description="Farklı bir isim veya uzmanlık deneyin." />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {searchQuery.data?.items.map((dietitian) => (
          <Link key={dietitian.id} href={`/diyetisyenler/${dietitian.id}`}>
            <Card className="p-4 transition-shadow hover:shadow-md">
              <div className="flex items-center gap-2 font-medium text-foreground">
                {dietitian.firstName} {dietitian.lastName}
                {dietitian.verificationStatus === "VERIFIED" && <Badge variant="success">Onaylı</Badge>}
              </div>
              {dietitian.title && <p className="text-sm text-muted-foreground">{dietitian.title}</p>}
              {dietitian.specialties.length > 0 && (
                <p className="mt-1 text-xs text-muted-foreground/80">{dietitian.specialties.join(", ")}</p>
              )}
              {dietitian.averageRating !== null && (
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  {dietitian.averageRating.toFixed(1)}
                </p>
              )}
            </Card>
          </Link>
        ))}
      </div>

      {searchQuery.data && searchQuery.data.items.length < searchQuery.data.total && (
        <Button variant="outline" className="mt-6" onClick={() => setLimit((current) => current + PAGE_SIZE)}>
          Daha Fazla Yükle
        </Button>
      )}
    </div>
  );
}
