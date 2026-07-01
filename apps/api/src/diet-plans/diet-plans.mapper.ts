import type {
  DietPlan,
  DietPlanDay,
  DietPlanMeal,
  DietPlanMealItem,
  FoodItem,
  NutrientData,
} from "@fit-sihirbaz/db";
import type {
  DietPlanDayView,
  DietPlanDetail,
  DietPlanMealItemView,
  DietPlanMealView,
  DietPlanSummary,
} from "@fit-sihirbaz/shared";
import { addTotals, calculateItemNutrients, zeroTotals } from "./diet-plans.calculator";
import { DietPlanFoodItemNotFoundError } from "./diet-plans.errors";

type FoodItemWithNutrients = FoodItem & { nutrientData: NutrientData | null };
type MealItemRow = DietPlanMealItem & { foodItem: FoodItemWithNutrients | null };
type MealRow = DietPlanMeal & { items: MealItemRow[] };
type DayRow = DietPlanDay & { meals: MealRow[] };
export type DietPlanWithHierarchy = DietPlan & { days: DayRow[] };

function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

function toDateOnlyString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function toTimeString(value: Date): string {
  return value.toISOString().slice(11, 16);
}

function buildMealItemView(item: MealItemRow): DietPlanMealItemView {
  if (!item.foodItem || !item.foodItem.nutrientData) {
    throw new DietPlanFoodItemNotFoundError();
  }
  const nutrients = calculateItemNutrients({
    caloriesPer100g: Number(item.foodItem.nutrientData.calories),
    proteinPer100g: Number(item.foodItem.nutrientData.protein),
    carbsPer100g: Number(item.foodItem.nutrientData.carbs),
    fatPer100g: Number(item.foodItem.nutrientData.fat),
    servingGramWeight: toNullableNumber(item.foodItem.servingGramWeight),
    quantity: Number(item.quantity),
    unit: item.unit,
  });

  return {
    id: item.id,
    foodItemId: item.foodItem.id,
    foodName: item.foodItem.name,
    quantity: Number(item.quantity),
    unit: item.unit,
    ...nutrients,
  };
}

function buildMealView(meal: MealRow): DietPlanMealView {
  const items = meal.items.map(buildMealItemView);
  const totals = items.reduce((acc, item) => addTotals(acc, item), zeroTotals());
  return {
    id: meal.id,
    mealType: meal.mealType,
    plannedTime: meal.plannedTime ? toTimeString(meal.plannedTime) : null,
    items,
    totals,
  };
}

function buildDayView(day: DayRow): DietPlanDayView {
  const meals = day.meals.map(buildMealView);
  const totals = meals.reduce((acc, meal) => addTotals(acc, meal.totals), zeroTotals());
  return { id: day.id, dayNumber: day.dayNumber, meals, totals };
}

export function toDietPlanSummary(plan: DietPlan): DietPlanSummary {
  return {
    id: plan.id,
    clientId: plan.clientId,
    dietitianId: plan.dietitianId,
    title: plan.title,
    startDate: toDateOnlyString(plan.startDate),
    endDate: plan.endDate ? toDateOnlyString(plan.endDate) : null,
    targetCalories: plan.targetCalories,
    targetProteinG: toNullableNumber(plan.targetProteinG),
    targetCarbsG: toNullableNumber(plan.targetCarbsG),
    targetFatG: toNullableNumber(plan.targetFatG),
    status: plan.status,
  };
}

export function toDietPlanDetail(plan: DietPlanWithHierarchy): DietPlanDetail {
  const days = plan.days.map(buildDayView);
  const totals = days.reduce((acc, day) => addTotals(acc, day.totals), zeroTotals());
  return { ...toDietPlanSummary(plan), days, totals };
}
