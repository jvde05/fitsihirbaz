import type { FoodItem, FoodSource, NutrientData } from "@fit-sihirbaz/db";
import type { FoodDetail, FoodSummary } from "@fit-sihirbaz/shared";

type FoodItemWithNutrients = FoodItem & { nutrientData: NutrientData };
type FoodItemWithNutrientsAndSource = FoodItemWithNutrients & { source: FoodSource };

function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function toFoodSummary(foodItem: FoodItemWithNutrients): FoodSummary {
  return {
    id: foodItem.id,
    name: foodItem.name,
    nameEn: foodItem.nameEn,
    category: foodItem.category,
    servingDescription: foodItem.servingDescription,
    servingGramWeight: toNullableNumber(foodItem.servingGramWeight),
    imageUrl: foodItem.imageUrl,
    isVerified: foodItem.isVerified,
    calories: Number(foodItem.nutrientData.calories),
    protein: Number(foodItem.nutrientData.protein),
    carbs: Number(foodItem.nutrientData.carbs),
    fat: Number(foodItem.nutrientData.fat),
  };
}

export function toFoodDetail(foodItem: FoodItemWithNutrientsAndSource): FoodDetail {
  const { nutrientData } = foodItem;
  return {
    ...toFoodSummary(foodItem),
    sourceId: foodItem.sourceId,
    sourceName: foodItem.source.name,
    sourceCitation: foodItem.source.citation,
    sourceUrl: foodItem.source.url,
    fiber: toNullableNumber(nutrientData.fiber),
    sugar: toNullableNumber(nutrientData.sugar),
    glycemicIndex: nutrientData.glycemicIndex ?? null,
    oracValue: toNullableNumber(nutrientData.oracValue),
    vitamins: (nutrientData.vitamins as Record<string, number> | null) ?? null,
    minerals: (nutrientData.minerals as Record<string, number> | null) ?? null,
    aminoAcids: (nutrientData.aminoAcids as Record<string, number> | null) ?? null,
    fattyAcids: (nutrientData.fattyAcids as Record<string, number> | null) ?? null,
  };
}
