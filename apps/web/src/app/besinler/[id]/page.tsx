"use client";

import { useParams } from "next/navigation";
import { trpc } from "@/lib/trpc";
import { resolveMediaUrl } from "@/lib/media";
import { RequireAuth } from "@/components/auth/RequireAuth";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

function NutrientGroup({ title, values }: { title: string; values: Record<string, number> | null }) {
  if (!values || Object.keys(values).length === 0) {
    return null;
  }
  return (
    <Card className="p-4">
      <h3 className="mb-2 text-sm font-semibold text-foreground">{title}</h3>
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
        {Object.entries(values).map(([key, value]) => (
          <div key={key} className="flex justify-between gap-2">
            <dt className="text-muted-foreground">{key}</dt>
            <dd className="text-foreground">{value}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

function BesinDetayContent() {
  const params = useParams<{ id: string }>();
  const foodQuery = trpc.foods.getById.useQuery({ id: params.id });

  if (foodQuery.isLoading) {
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }
  if (foodQuery.isError) {
    return <QueryErrorNotice message={foodQuery.error.message} onRetry={() => foodQuery.refetch()} />;
  }
  if (!foodQuery.data) {
    return <p className="text-muted-foreground">Besin bulunamadı.</p>;
  }

  const food = foodQuery.data;
  const resolvedImageUrl = resolveMediaUrl(food.imageUrl);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {resolvedImageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolvedImageUrl}
          alt={food.name}
          className="h-56 w-full rounded-lg object-cover"
        />
      )}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-foreground">{food.name}</h1>
          {!food.isVerified && <Badge variant="warning">Onay bekliyor</Badge>}
        </div>
        {food.nameEn && <p className="text-sm text-muted-foreground">{food.nameEn}</p>}
        <p className="mt-1 text-sm text-muted-foreground">
          {food.category}
          {food.servingDescription && ` · ${food.servingDescription}`}
        </p>
      </div>

      <Card className="p-4">
        <h2 className="mb-2 text-sm font-semibold text-foreground">Temel Besin Değerleri (100g)</h2>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-muted-foreground">Kalori</dt>
            <dd className="text-lg font-medium text-foreground">{food.calories} kcal</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Protein</dt>
            <dd className="text-lg font-medium text-foreground">{food.protein} g</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Karbonhidrat</dt>
            <dd className="text-lg font-medium text-foreground">{food.carbs} g</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Yağ</dt>
            <dd className="text-lg font-medium text-foreground">{food.fat} g</dd>
          </div>
          {food.fiber !== null && (
            <div>
              <dt className="text-muted-foreground">Lif</dt>
              <dd className="text-foreground">{food.fiber} g</dd>
            </div>
          )}
          {food.sugar !== null && (
            <div>
              <dt className="text-muted-foreground">Şeker</dt>
              <dd className="text-foreground">{food.sugar} g</dd>
            </div>
          )}
          {food.glycemicIndex !== null && (
            <div>
              <dt className="text-muted-foreground">Glisemik İndeks</dt>
              <dd className="text-foreground">{food.glycemicIndex}</dd>
            </div>
          )}
        </dl>
      </Card>

      <NutrientGroup title="Vitaminler" values={food.vitamins} />
      <NutrientGroup title="Mineraller" values={food.minerals} />
      <NutrientGroup title="Amino Asitler" values={food.aminoAcids} />
      <NutrientGroup title="Yağ Asitleri" values={food.fattyAcids} />

      <Card className="bg-muted/30 p-4">
        <h2 className="mb-1 text-sm font-semibold text-foreground">Kaynak</h2>
        <p className="text-sm text-foreground/90">{food.sourceName}</p>
        <p className="mt-1 text-sm text-muted-foreground">{food.sourceCitation}</p>
        {food.sourceUrl && (
          <a
            href={food.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-sm text-primary hover:underline"
          >
            Kaynağa git →
          </a>
        )}
      </Card>
    </div>
  );
}

export default function BesinDetayPage() {
  return (
    <RequireAuth>
      <BesinDetayContent />
    </RequireAuth>
  );
}
