"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FoodCreateInputSchema, type FoodCreateInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";

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
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Besin Onayı</h1>

      <form
        onSubmit={handleSubmit(onCreateSubmit)}
        className="mb-8 flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <h2 className="text-sm font-semibold text-gray-700">Yeni Besin Ekle</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="food-name">
              Ad
            </label>
            <input
              id="food-name"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("name")}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="food-category">
              Kategori
            </label>
            <input
              id="food-category"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("category")}
            />
            {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="food-calories">
              Kalori (100g)
            </label>
            <input
              id="food-calories"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("calories")}
            />
            {errors.calories && <p className="mt-1 text-sm text-red-600">{errors.calories.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="food-protein">
              Protein (g)
            </label>
            <input
              id="food-protein"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("protein")}
            />
            {errors.protein && <p className="mt-1 text-sm text-red-600">{errors.protein.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="food-carbs">
              Karbonhidrat (g)
            </label>
            <input
              id="food-carbs"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("carbs")}
            />
            {errors.carbs && <p className="mt-1 text-sm text-red-600">{errors.carbs.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="food-fat">
              Yağ (g)
            </label>
            <input
              id="food-fat"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("fat")}
            />
            {errors.fat && <p className="mt-1 text-sm text-red-600">{errors.fat.message}</p>}
          </div>
        </div>
        {createError && <p className="text-sm text-red-600">{createError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Ekleniyor..." : "Besini Ekle (Onay Bekleyecek)"}
        </button>
      </form>

      <p className="mb-4 text-sm text-gray-500">
        Bir besin adı arayın; onaylı olmayan besinleri onaylayabilir veya onayı geri alabilirsiniz.
      </p>

      <input
        type="text"
        placeholder="Besin ara..."
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        className="mb-6 w-full max-w-md rounded-md border border-gray-300 px-3 py-2"
      />

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {searchQuery.data?.items.map((food) => (
          <li key={food.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <Link href={`/besinler/${food.id}`} className="font-medium text-gray-900 hover:underline">
                {food.name}
              </Link>
              <p className="text-sm text-gray-500">
                {food.category} · {food.calories} kcal/100g
              </p>
            </div>
            <button
              type="button"
              onClick={() => verifyMutation.mutate({ id: food.id, approve: !food.isVerified })}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${
                food.isVerified
                  ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
                  : "bg-brand-600 text-white hover:bg-brand-700"
              }`}
            >
              {food.isVerified ? "Onayı Geri Al" : "Onayla"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
