import type { MeasurementUnit, NutrientTotals } from "@fit-sihirbaz/shared";

export function zeroTotals(): NutrientTotals {
  return { calories: 0, protein: 0, carbs: 0, fat: 0 };
}

export function addTotals(a: NutrientTotals, b: NutrientTotals): NutrientTotals {
  return {
    calories: a.calories + b.calories,
    protein: a.protein + b.protein,
    carbs: a.carbs + b.carbs,
    fat: a.fat + b.fat,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface CalculateItemNutrientsParams {
  caloriesPer100g: number;
  proteinPer100g: number;
  carbsPer100g: number;
  fatPer100g: number;
  servingGramWeight: number | null;
  quantity: number;
  unit: MeasurementUnit;
}

// NutrientData değerleri 100g üzerinden tutulur (bkz. DATABASE.md §7). GRAM/ML birimleri
// doğrudan gram karşılığı kabul edilir (sıvılar için ~1g/mL yaklaşımı yapılır);
// PORTION/PIECE için FoodItem.servingGramWeight kullanılır, tanımlı değilse 100g varsayılır.
export function calculateItemNutrients(params: CalculateItemNutrientsParams): NutrientTotals {
  const gramEquivalent =
    params.unit === "GRAM" || params.unit === "ML"
      ? params.quantity
      : (params.servingGramWeight ?? 100) * params.quantity;
  const factor = gramEquivalent / 100;

  return {
    calories: round2(params.caloriesPer100g * factor),
    protein: round2(params.proteinPer100g * factor),
    carbs: round2(params.carbsPer100g * factor),
    fat: round2(params.fatPer100g * factor),
  };
}
