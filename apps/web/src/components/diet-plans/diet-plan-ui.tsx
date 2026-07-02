import { MEAL_TYPE_LABELS, type NutrientTotals } from "@fit-sihirbaz/shared";

export { MEAL_TYPE_LABELS };

export function TotalsBadge({ totals }: { totals: NutrientTotals }) {
  return (
    <span className="text-xs text-gray-500">
      {totals.calories} kcal · P {totals.protein}g · K {totals.carbs}g · Y {totals.fat}g
    </span>
  );
}
