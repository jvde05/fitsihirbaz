"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { MeasurementUnit } from "@fit-sihirbaz/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    <div className="mt-2 rounded-md border border-dashed p-3">
      <div className="mb-2 flex gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode === "FOOD" ? "default" : "secondary"}
          onClick={() => switchMode("FOOD")}
          data-testid="meal-item-mode-food"
        >
          Besin
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "RECIPE" ? "default" : "secondary"}
          onClick={() => switchMode("RECIPE")}
          data-testid="meal-item-mode-recipe"
        >
          Tarif
        </Button>
      </div>

      {!selectedId ? (
        <div>
          <Input
            type="text"
            placeholder={mode === "FOOD" ? "Besin ara (örn. elma)" : "Tarif ara (örn. çorba)"}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {mode === "FOOD" ? (
            <>
              {foodSearchQuery.isFetching && <p className="mt-1 text-xs text-muted-foreground">Aranıyor...</p>}
              {foodSearchQuery.data && foodSearchQuery.data.items.length > 0 && (
                <ul className="mt-2 max-h-40 divide-y overflow-y-auto rounded-md border text-sm">
                  {foodSearchQuery.data.items.map((food) => (
                    <li key={food.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(food.id);
                          setSelectedName(food.name);
                        }}
                        data-testid="food-search-result"
                        className="flex w-full justify-between px-2 py-1.5 text-left hover:bg-muted"
                      >
                        <span>{food.name}</span>
                        <span className="text-muted-foreground">{food.calories} kcal/100g</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {query.trim().length > 1 && foodSearchQuery.data?.items.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Sonuç bulunamadı.</p>
              )}
            </>
          ) : (
            <>
              {recipeResults.length > 0 && (
                <ul className="mt-2 max-h-40 divide-y overflow-y-auto rounded-md border text-sm">
                  {recipeResults.map((recipe) => (
                    <li key={recipe.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedId(recipe.id);
                          setSelectedName(recipe.name);
                        }}
                        data-testid="recipe-search-result"
                        className="flex w-full justify-between px-2 py-1.5 text-left hover:bg-muted"
                      >
                        <span>{recipe.name}</span>
                        <span className="text-muted-foreground">{recipe.totalsPerServing.calories} kcal/porsiyon</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {recipeSearchQuery.data?.length === 0 && (
                <p className="mt-1 text-xs text-muted-foreground">Henüz erişebileceğiniz bir tarif yok.</p>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{selectedName}</span>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            data-testid="meal-item-quantity"
            className="w-20"
          />
          {mode === "FOOD" ? (
            <Select value={unit} onValueChange={(value) => setUnit(value as MeasurementUnit)}>
              <SelectTrigger className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(UNIT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <span className="text-muted-foreground">porsiyon</span>
          )}
          <Button
            type="button"
            size="sm"
            onClick={handleAdd}
            disabled={addItemMutation.isLoading}
            data-testid="meal-item-add-button"
          >
            {addItemMutation.isLoading ? "Ekleniyor..." : "Ekle"}
          </Button>
          <button type="button" onClick={() => setSelectedId(null)} className="text-sm text-muted-foreground hover:underline">
            Vazgeç
          </button>
        </div>
      )}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
