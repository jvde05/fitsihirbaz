"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { RecipeCreateInputSchema, type RecipeIngredientInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { IngredientPicker } from "@/components/recipes/IngredientPicker";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

const RecipeMetaFormSchema = RecipeCreateInputSchema.omit({ ingredients: true });
type RecipeMetaForm = z.infer<typeof RecipeMetaFormSchema>;

export default function TariflerPage() {
  const utils = trpc.useUtils();
  const recipesQuery = trpc.recipes.list.useQuery({ mineOnly: true });
  const [ingredients, setIngredients] = useState<(RecipeIngredientInput & { foodName: string })[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = trpc.recipes.create.useMutation({
    onSuccess: () => {
      reset();
      setIngredients([]);
      setFormError(null);
      utils.recipes.list.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<RecipeMetaForm>({
    resolver: zodResolver(RecipeMetaFormSchema),
    defaultValues: { isPublic: false },
  });

  async function onSubmit(values: RecipeMetaForm) {
    if (ingredients.length === 0) {
      setFormError("En az bir malzeme eklemelisiniz");
      return;
    }
    setFormError(null);
    await createMutation.mutateAsync({
      ...values,
      ingredients: ingredients.map(({ foodItemId, quantity, unit }) => ({ foodItemId, quantity, unit })),
    });
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Tariflerim</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border p-4">
        <h2 className="text-sm font-semibold text-foreground">Yeni Tarif</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="name">Tarif Adı</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="servings">Porsiyon Sayısı</Label>
            <Input id="servings" type="number" min="1" {...register("servings")} />
            {errors.servings && <p className="text-sm text-destructive">{errors.servings.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Açıklama (opsiyonel)</Label>
          <Textarea id="description" rows={2} {...register("description")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="instructions">Hazırlanışı (opsiyonel)</Label>
          <Textarea id="instructions" rows={3} {...register("instructions")} />
        </div>
        <Controller
          control={control}
          name="isPublic"
          render={({ field }) => (
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
              Literatür/pazaryeri kütüphanesinde herkese açık göster
            </label>
          )}
        />

        <div>
          <h3 className="mb-2 text-sm font-medium text-foreground">Malzemeler</h3>
          {ingredients.length > 0 && (
            <ul className="mb-2 divide-y rounded-md border text-sm" data-testid="ingredient-list">
              {ingredients.map((ingredient, index) => (
                <li key={`${ingredient.foodItemId}-${index}`} className="flex items-center justify-between px-3 py-1.5">
                  <span>
                    {ingredient.foodName} — {ingredient.quantity} {ingredient.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))}
                    className="text-xs text-destructive hover:underline"
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}
          <IngredientPicker onAdd={(ingredient) => setIngredients((prev) => [...prev, ingredient])} />
        </div>

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={isSubmitting} data-testid="create-recipe-button" className="self-start">
          {isSubmitting ? "Oluşturuluyor..." : "Tarif Oluştur"}
        </Button>
      </form>

      {recipesQuery.isError && (
        <QueryErrorNotice message={recipesQuery.error.message} onRetry={() => recipesQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {recipesQuery.data?.map((recipe) => (
          <li key={recipe.id} className="px-4 py-3">
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{recipe.name}</p>
              <Badge variant={recipe.isPublic ? "success" : "secondary"}>
                {recipe.isPublic ? "Herkese Açık" : "Özel"}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {recipe.servings} porsiyon · porsiyon başı {recipe.totalsPerServing.calories} kcal, P
              {recipe.totalsPerServing.protein}g / K{recipe.totalsPerServing.carbs}g / Y{recipe.totalsPerServing.fat}g
            </p>
          </li>
        ))}
        {recipesQuery.data?.length === 0 && (
          <li className="px-4 py-6">
            <EmptyState title="Henüz tarif eklemediniz" />
          </li>
        )}
      </ul>
    </div>
  );
}
