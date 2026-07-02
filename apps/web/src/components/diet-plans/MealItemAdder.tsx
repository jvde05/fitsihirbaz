"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { MeasurementUnit } from "@fit-sihirbaz/shared";

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAM: "gram",
  ML: "ml",
  PORTION: "porsiyon",
  PIECE: "adet",
};

type Mode = "FOOD" | "RECIPE";

export function MealItemAdder({ mealId, onAdded }: { mealId: string; onAdded: () => void }) {
  const [mode, setMode] = useState<Mode>("FOOD");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedName, setSelectedName] = useState<string>("");
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<MeasurementUnit>("GRAM");
  const [error, setError] = useState<string | null>(null);

  const foodSearchQuery = trpc.foods.search.useQuery(
    { query, limit: 10 },
    { enabled: mode === "FOOD" && query.trim().length > 1 },
  );
  const recipeSearchQuery = trpc.recipes.list.useQuery({ mineOnly: false }, { enabled: mode === "RECIPE" });

  const addItemMutation = trpc.dietPlans.addMealItem.useMutation({
    onSuccess: () => {
      resetSelection();
      onAdded();
    },
    onError: (err) => setError(err.message),
  });

  function resetSelection() {
    setSelectedId(null);
    setSelectedName("");
    setQuery("");
    setError(null);
  }

  function switchMode(next: Mode) {
    setMode(next);
    resetSelection();
    setQuantity(next === "RECIPE" ? "1" : "100");
    setUnit(next === "RECIPE" ? "PORTION" : "GRAM");
  }

  function handleAdd() {
    if (!selectedId) return;
    setError(null);
    addItemMutation.mutate({
      dietPlanMealId: mealId,
      ...(mode === "FOOD" ? { foodItemId: selectedId } : { recipeId: selectedId }),
      quantity: Number(quantity),
      unit,
    });
  }

  const recipeResults =
    mode === "RECIPE" && query.trim().length > 0
      ? (recipeSearchQuery.data ?? []).filter((recipe) => recipe.name.toLowerCase().includes(query.trim().toLowerCase()))
      : (recipeSearchQuery.data ?? []);

  return (
    <div className="mt-2 rounded-md border border-dashed border-gray-300 p-3">
      <div className="mb-2 flex gap-2 text-xs">
        <button
          type="button"
          onClick={() => switchMode("FOOD")}
          data-testid="meal-item-mode-food"
          className={`rounded-md px-2 py-1 ${mode === "FOOD" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          Besin
        </button>
        <button
          type="button"
          onClick={() => switchMode("RECIPE")}
          data-testid="meal-item-mode-recipe"
          className={`rounded-md px-2 py-1 ${mode === "RECIPE" ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"}`}
        >
          Tarif
        </button>
      </div>

      {!selectedId ? (
        <div>
          <input
            type="text"
            placeholder={mode === "FOOD" ? "Besin ara (örn. elma)" : "Tarif ara (örn. çorba)"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          {mode === "FOOD" ? (
            <>
              {foodSearchQuery.isFetching && <p className="mt-1 text-xs text-gray-400">Aranıyor...</p>}
              {foodSearchQuery.data && foodSearchQuery.data.items.length > 0 && (
                <ul className="mt-2 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 text-sm">
                  {foodSearchQuery.data.items.map((food) => (
                    <li key={food.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(food.id);
                          setSelectedName(food.name);
                        }}
                        data-testid="food-search-result"
                        className="flex w-full justify-between px-2 py-1.5 text-left hover:bg-gray-50"
                      >
                        <span>{food.name}</span>
                        <span className="text-gray-400">{food.calories} kcal/100g</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length > 1 && foodSearchQuery.data?.items.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">Sonuç bulunamadı.</p>
              )}
            </>
          ) : (
            <>
              {recipeResults.length > 0 && (
                <ul className="mt-2 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 text-sm">
                  {recipeResults.map((recipe) => (
                    <li key={recipe.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(recipe.id);
                          setSelectedName(recipe.name);
                        }}
                        data-testid="recipe-search-result"
                        className="flex w-full justify-between px-2 py-1.5 text-left hover:bg-gray-50"
                      >
                        <span>{recipe.name}</span>
                        <span className="text-gray-400">{recipe.totalsPerServing.calories} kcal/porsiyon</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {recipeSearchQuery.data?.length === 0 && (
                <p className="mt-1 text-xs text-gray-400">Henüz erişebileceğiniz bir tarif yok.</p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{selectedName}</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            data-testid="meal-item-quantity"
            className="w-20 rounded-md border border-gray-300 px-2 py-1"
          />
          {mode === "FOOD" ? (
            <select
              value={unit}
              onChange={(event) => setUnit(event.target.value as MeasurementUnit)}
              className="rounded-md border border-gray-300 px-2 py-1"
            >
              {Object.entries(UNIT_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-gray-500">porsiyon</span>
          )}
          <button
            type="button"
            onClick={handleAdd}
            disabled={addItemMutation.isLoading}
            data-testid="meal-item-add-button"
            className="rounded-md bg-brand-600 px-3 py-1 text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {addItemMutation.isLoading ? "Ekleniyor..." : "Ekle"}
          </button>
          <button type="button" onClick={() => setSelectedId(null)} className="text-gray-500 hover:underline">
            Vazgeç
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
