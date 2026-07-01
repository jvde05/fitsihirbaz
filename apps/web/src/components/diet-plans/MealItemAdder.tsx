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

export function MealItemAdder({ mealId, onAdded }: { mealId: string; onAdded: () => void }) {
  const [query, setQuery] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedFoodName, setSelectedFoodName] = useState<string>("");
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<MeasurementUnit>("GRAM");
  const [error, setError] = useState<string | null>(null);

  const searchQuery = trpc.foods.search.useQuery(
    { query, limit: 10 },
    { enabled: query.trim().length > 1 },
  );

  const addItemMutation = trpc.dietPlans.addMealItem.useMutation({
    onSuccess: () => {
      setSelectedFoodId(null);
      setSelectedFoodName("");
      setQuery("");
      setError(null);
      onAdded();
    },
    onError: (err) => setError(err.message),
  });

  function handleAdd() {
    if (!selectedFoodId) return;
    setError(null);
    addItemMutation.mutate({
      dietPlanMealId: mealId,
      foodItemId: selectedFoodId,
      quantity: Number(quantity),
      unit,
    });
  }

  return (
    <div className="mt-2 rounded-md border border-dashed border-gray-300 p-3">
      {!selectedFoodId ? (
        <div>
          <input
            type="text"
            placeholder="Besin ara (örn. elma)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
          {searchQuery.isFetching && <p className="mt-1 text-xs text-gray-400">Aranıyor...</p>}
          {searchQuery.data && searchQuery.data.items.length > 0 && (
            <ul className="mt-2 max-h-40 divide-y divide-gray-100 overflow-y-auto rounded-md border border-gray-200 text-sm">
              {searchQuery.data.items.map((food) => (
                <li key={food.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFoodId(food.id);
                      setSelectedFoodName(food.name);
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
          {query.trim().length > 1 && searchQuery.data?.items.length === 0 && (
            <p className="mt-1 text-xs text-gray-400">Sonuç bulunamadı.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">{selectedFoodName}</span>
          <input
            type="number"
            min="0"
            step="0.1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            data-testid="meal-item-quantity"
            className="w-20 rounded-md border border-gray-300 px-2 py-1"
          />
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
          <button
            type="button"
            onClick={handleAdd}
            disabled={addItemMutation.isLoading}
            data-testid="meal-item-add-button"
            className="rounded-md bg-brand-600 px-3 py-1 text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {addItemMutation.isLoading ? "Ekleniyor..." : "Ekle"}
          </button>
          <button
            type="button"
            onClick={() => setSelectedFoodId(null)}
            className="text-gray-500 hover:underline"
          >
            Vazgeç
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
