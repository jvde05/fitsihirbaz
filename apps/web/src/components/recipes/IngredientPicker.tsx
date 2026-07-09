"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { MeasurementUnit, RecipeIngredientInput } from "@fit-sihirbaz/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const UNIT_LABELS: Record<MeasurementUnit, string> = {
  GRAM: "gram",
  ML: "ml",
  PORTION: "porsiyon",
  PIECE: "adet",
};

export function IngredientPicker({
  onAdd,
}: {
  onAdd: (ingredient: RecipeIngredientInput & { foodName: string }) => void;
}) {
  const [query, setQuery] = useState("");
  const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
  const [selectedFoodName, setSelectedFoodName] = useState("");
  const [quantity, setQuantity] = useState("100");
  const [unit, setUnit] = useState<MeasurementUnit>("GRAM");

  const searchQuery = trpc.foods.search.useQuery({ query, limit: 10 }, { enabled: query.trim().length > 1 });

  function handleAdd() {
    if (!selectedFoodId) return;
    onAdd({ foodItemId: selectedFoodId, foodName: selectedFoodName, quantity: Number(quantity), unit });
    setSelectedFoodId(null);
    setSelectedFoodName("");
    setQuery("");
    setQuantity("100");
  }

  return (
    <div className="rounded-md border border-dashed p-3">
      {!selectedFoodId ? (
        <div>
          <Input
            type="text"
            placeholder="Malzeme ara (örn. yulaf)"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          {searchQuery.isFetching && <p className="mt-1 text-xs text-muted-foreground">Aranıyor...</p>}
          {searchQuery.data && searchQuery.data.items.length > 0 && (
            <ul className="mt-2 max-h-40 divide-y overflow-y-auto rounded-md border text-sm">
              {searchQuery.data.items.map((food) => (
                <li key={food.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFoodId(food.id);
                      setSelectedFoodName(food.name);
                    }}
                    data-testid="ingredient-search-result"
                    className="flex w-full justify-between px-2 py-1.5 text-left hover:bg-muted"
                  >
                    <span>{food.name}</span>
                    <span className="text-muted-foreground">{food.calories} kcal/100g</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
          {query.trim().length > 1 && searchQuery.data?.items.length === 0 && (
            <p className="mt-1 text-xs text-muted-foreground">Sonuç bulunamadı.</p>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{selectedFoodName}</span>
          <Input
            type="number"
            min="0"
            step="0.1"
            value={quantity}
            onChange={(event) => setQuantity(event.target.value)}
            data-testid="ingredient-quantity"
            className="w-20"
          />
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
          <Button type="button" size="sm" onClick={handleAdd} data-testid="ingredient-add-button">
            Ekle
          </Button>
          <button type="button" onClick={() => setSelectedFoodId(null)} className="text-sm text-muted-foreground hover:underline">
            Vazgeç
          </button>
        </div>
      )}
    </div>
  );
}
