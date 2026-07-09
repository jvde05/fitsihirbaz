"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FoodCreateInputSchema, type FoodCreateInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function AdminBesinlerPage() {
  const utils = trpc.useUtils();
  const [query, setQuery] = useState("");
  const searchQuery = trpc.foods.search.useQuery({ query, limit: 50 }, { enabled: query.trim().length > 1 });

  const verifyMutation = trpc.admin.foods.verify.useMutation({
    onSuccess: () => utils.foods.search.invalidate(),
  });

  const [createError, setCreateError] = useState<string | null>(null);
  const createMutation = trpc.foods.create.useMutation({
    onSuccess: () => {
      setCreateError(null);
      reset();
      utils.foods.search.invalidate();
    },
    onError: (err) => setCreateError(err.message),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FoodCreateInput>({ resolver: zodResolver(FoodCreateInputSchema) });

  async function onCreateSubmit(values: FoodCreateInput) {
    setCreateError(null);
    await createMutation.mutateAsync(values);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Besin Onayı</h1>

      <form onSubmit={handleSubmit(onCreateSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border p-4">
        <h2 className="text-sm font-semibold text-foreground">Yeni Besin Ekle</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="food-name">Ad</Label>
            <Input id="food-name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="food-category">Kategori</Label>
            <Input id="food-category" {...register("category")} />
            {errors.category && <p className="text-sm text-destructive">{errors.category.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="food-calories">Kalori (100g)</Label>
            <Input id="food-calories" type="number" step="0.1" {...register("calories")} />
            {errors.calories && <p className="text-sm text-destructive">{errors.calories.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="food-protein">Protein (g)</Label>
            <Input id="food-protein" type="number" step="0.1" {...register("protein")} />
            {errors.protein && <p className="text-sm text-destructive">{errors.protein.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="food-carbs">Karbonhidrat (g)</Label>
            <Input id="food-carbs" type="number" step="0.1" {...register("carbs")} />
            {errors.carbs && <p className="text-sm text-destructive">{errors.carbs.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="food-fat">Yağ (g)</Label>
            <Input id="food-fat" type="number" step="0.1" {...register("fat")} />
            {errors.fat && <p className="text-sm text-destructive">{errors.fat.message}</p>}
          </div>
        </div>
        {createError && <p className="text-sm text-destructive">{createError}</p>}
        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? "Ekleniyor..." : "Besini Ekle (Onay Bekleyecek)"}
        </Button>
      </form>

      <p className="mb-4 text-sm text-muted-foreground">
        Bir besin adı arayın; onaylı olmayan besinleri onaylayabilir veya onayı geri alabilirsiniz.
      </p>

      <Input
        type="text"
        placeholder="Besin ara..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-6 max-w-md"
      />

      {searchQuery.isError && (
        <QueryErrorNotice message={searchQuery.error.message} onRetry={() => searchQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {searchQuery.data?.items.map((food) => (
          <li key={food.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <Link href={`/besinler/${food.id}`} className="font-medium text-foreground hover:underline">
                {food.name}
              </Link>
              <p className="text-sm text-muted-foreground">
                {food.category} · {food.calories} kcal/100g
              </p>
              {food.isVerified && <Badge variant="success">Onaylı</Badge>}
            </div>
            <Button
              type="button"
              variant={food.isVerified ? "outline" : "default"}
              size="sm"
              onClick={() => verifyMutation.mutate({ id: food.id, approve: !food.isVerified })}
            >
              {food.isVerified ? "Onayı Geri Al" : "Onayla"}
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
