import { z } from "zod";
import { optionalCoerced } from "./common";
import { MeasurementUnitSchema, NutrientTotalsSchema } from "./diet-plan";

export const RecipeIngredientInputSchema = z.object({
  foodItemId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unit: MeasurementUnitSchema,
});
export type RecipeIngredientInput = z.infer<typeof RecipeIngredientInputSchema>;

export const RecipeIngredientViewSchema = RecipeIngredientInputSchema.extend({
  id: z.string().uuid(),
  foodName: z.string(),
});
export type RecipeIngredientView = z.infer<typeof RecipeIngredientViewSchema>;

export const RecipeCreateInputSchema = z.object({
  name: z.string().min(1, "Tarif adı zorunlu").max(200),
  description: optionalCoerced(z.string().min(1).max(2000)),
  servings: z.coerce.number().int().positive(),
  instructions: optionalCoerced(z.string().min(1).max(5000)),
  isPublic: z.boolean().default(false),
  ingredients: z.array(RecipeIngredientInputSchema).min(1, "En az bir malzeme eklenmeli"),
});
export type RecipeCreateInput = z.infer<typeof RecipeCreateInputSchema>;

export const RecipeUpdateInputSchema = RecipeCreateInputSchema.extend({
  id: z.string().uuid(),
});
export type RecipeUpdateInput = z.infer<typeof RecipeUpdateInputSchema>;

export const RecipeSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().nullable(),
  servings: z.number().int(),
  isPublic: z.boolean(),
  createdByUserId: z.string().uuid(),
  totalsPerServing: NutrientTotalsSchema,
});
export type RecipeSummary = z.infer<typeof RecipeSummarySchema>;

export const RecipeDetailSchema = RecipeSummarySchema.extend({
  instructions: z.string().nullable(),
  ingredients: z.array(RecipeIngredientViewSchema),
  totals: NutrientTotalsSchema,
});
export type RecipeDetail = z.infer<typeof RecipeDetailSchema>;

// isPublic=false ise sadece createdByUserId sahibi görebilir (kendi özel tarifi);
// admin her zaman görebilir.
export const RecipeListInputSchema = z.object({
  mineOnly: z.boolean().default(false),
});
export type RecipeListInput = z.infer<typeof RecipeListInputSchema>;
