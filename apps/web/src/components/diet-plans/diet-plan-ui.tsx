import type { MealType, NutrientTotals } from "@fit-sihirbaz/shared";

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: "Kahvaltı",
  LUNCH: "Öğle Yemeği",
  DINNER: "Akşam Yemeği",
  SNACK: "Ara Öğün",
};

export function TotalsBadge({ totals }: { totals: NutrientTotals }) {
  return (
    <span className="text-xs text-gray-500">
      {totals.calories} kcal · P {totals.protein}g · K {totals.carbs}g · Y {totals.fat}g
    </span>
  );
}
