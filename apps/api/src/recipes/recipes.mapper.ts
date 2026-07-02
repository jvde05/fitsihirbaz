import type { FoodItem, MeasurementUnit, NutrientData, Recipe, RecipeIngredient } from "@fit-sihirbaz/db";
import type { NutrientTotals, RecipeDetail, RecipeIngredientView, RecipeSummary } from "@fit-sihirbaz/shared";
import { addTotals, calculateItemNutrients, zeroTotals } from "../diet-plans/diet-plans.calculator";

type IngredientWithFoodItem = RecipeIngredient & { foodItem: FoodItem & { nutrientData: NutrientData | null } };
export type RecipeWithIngredients = Recipe & { ingredients: IngredientWithFoodItem[] };

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function calculateTotals(ingredients: IngredientWithFoodItem[]) {
  return ingredients.reduce((totals, ingredient) => {
    if (!ingredient.foodItem.nutrientData) {
      return totals;
    }
    const nutrients = calculateItemNutrients({
      caloriesPer100g: Number(ingredient.foodItem.nutrientData.calories),
      proteinPer100g: Number(ingredient.foodItem.nutrientData.protein),
      carbsPer100g: Number(ingredient.foodItem.nutrientData.carbs),
      fatPer100g: Number(ingredient.foodItem.nutrientData.fat),
      servingGramWeight:
        ingredient.foodItem.servingGramWeight === null ? null : Number(ingredient.foodItem.servingGramWeight),
      quantity: Number(ingredient.quantity),
      unit: ingredient.unit as MeasurementUnit,
    });
    return addTotals(totals, nutrients);
  }, zeroTotals());
}

export function calculateRecipeTotalsPerServing(recipe: RecipeWithIngredients): NutrientTotals {
  const totals = calculateTotals(recipe.ingredients);
  return {
    calories: round2(totals.calories / recipe.servings),
    protein: round2(totals.protein / recipe.servings),
    carbs: round2(totals.carbs / recipe.servings),
    fat: round2(totals.fat / recipe.servings),
  };
}

export function toRecipeSummary(recipe: RecipeWithIngredients): RecipeSummary {
  return {
    id: recipe.id,
    name: recipe.name,
    description: recipe.description,
    servings: recipe.servings,
    isPublic: recipe.isPublic,
    createdByUserId: recipe.createdByUserId,
    totalsPerServing: calculateRecipeTotalsPerServing(recipe),
  };
}

export function toRecipeDetail(recipe: RecipeWithIngredients): RecipeDetail {
  const totals = calculateTotals(recipe.ingredients);
  const ingredients: RecipeIngredientView[] = recipe.ingredients.map((ingredient) => ({
    id: ingredient.id,
    foodItemId: ingredient.foodItemId,
    foodName: ingredient.foodItem.name,
    quantity: Number(ingredient.quantity),
    unit: ingredient.unit as MeasurementUnit,
  }));

  return {
    ...toRecipeSummary(recipe),
    instructions: recipe.instructions,
    ingredients,
    totals,
  };
}
