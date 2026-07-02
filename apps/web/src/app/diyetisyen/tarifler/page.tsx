"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { RecipeCreateInputSchema, type RecipeIngredientInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { IngredientPicker } from "@/components/recipes/IngredientPicker";

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
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Tariflerim</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700">Yeni Tarif</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="name">
              Tarif Adı
            </label>
            <input
              id="name"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("name")}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="servings">
              Porsiyon Sayısı
            </label>
            <input
              id="servings"
              type="number"
              min="1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("servings")}
            />
            {errors.servings && <p className="mt-1 text-sm text-red-600">{errors.servings.message}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="description">
            Açıklama (opsiyonel)
          </label>
          <textarea
            id="description"
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("description")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="instructions">
            Hazırlanışı (opsiyonel)
          </label>
          <textarea
            id="instructions"
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("instructions")}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-700">
          <input type="checkbox" {...register("isPublic")} />
          Literatür/pazaryeri kütüphanesinde herkese açık göster
        </label>

        <div>
          <h3 className="mb-2 text-sm font-medium text-gray-700">Malzemeler</h3>
          {ingredients.length > 0 && (
            <ul className="mb-2 divide-y divide-gray-100 rounded-md border border-gray-200 text-sm" data-testid="ingredient-list">
              {ingredients.map((ingredient, index) => (
                <li key={`${ingredient.foodItemId}-${index}`} className="flex items-center justify-between px-3 py-1.5">
                  <span>
                    {ingredient.foodName} — {ingredient.quantity} {ingredient.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIngredients((prev) => prev.filter((_, i) => i !== index))}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Kaldır
                  </button>
                </li>
              ))}
            </ul>
          )}
          <IngredientPicker onAdd={(ingredient) => setIngredients((prev) => [...prev, ingredient])} />
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="create-recipe-button"
          className="self-start rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Oluşturuluyor..." : "Tarif Oluştur"}
        </button>
      </form>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {recipesQuery.data?.map((recipe) => (
          <li key={recipe.id} className="px-4 py-3">
            <p className="font-medium text-gray-900">
              {recipe.name}{" "}
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${recipe.isPublic ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"}`}>
                {recipe.isPublic ? "Herkese Açık" : "Özel"}
              </span>
            </p>
            <p className="text-sm text-gray-500">
              {recipe.servings} porsiyon · porsiyon başı {recipe.totalsPerServing.calories} kcal, P
              {recipe.totalsPerServing.protein}g / K{recipe.totalsPerServing.carbs}g / Y{recipe.totalsPerServing.fat}g
            </p>
          </li>
        ))}
        {recipesQuery.data?.length === 0 && (
          <li className="px-4 py-6 text-center text-sm text-gray-400">Henüz tarif eklemediniz.</li>
        )}
      </ul>
    </div>
  );
}
