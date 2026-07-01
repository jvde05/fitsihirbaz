import { z } from "zod";

export const DietPlanStatusSchema = z.enum(["DRAFT", "ACTIVE", "COMPLETED", "ARCHIVED"]);
export type DietPlanStatus = z.infer<typeof DietPlanStatusSchema>;

export const MealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);
export type MealType = z.infer<typeof MealTypeSchema>;

export const MeasurementUnitSchema = z.enum(["GRAM", "ML", "PORTION", "PIECE"]);
export type MeasurementUnit = z.infer<typeof MeasurementUnitSchema>;

export const NutrientTotalsSchema = z.object({
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});
export type NutrientTotals = z.infer<typeof NutrientTotalsSchema>;

export const CreateDietPlanInputSchema = z.object({
  clientId: z.string().uuid(),
  title: z.string().min(1, "Başlık zorunlu").max(200),
  startDate: z.string().date("YYYY-MM-DD formatında olmalı"),
  endDate: z.string().date("YYYY-MM-DD formatında olmalı").optional(),
  targetCalories: z.coerce.number().int().positive().optional(),
  targetProteinG: z.coerce.number().nonnegative().optional(),
  targetCarbsG: z.coerce.number().nonnegative().optional(),
  targetFatG: z.coerce.number().nonnegative().optional(),
});
export type CreateDietPlanInput = z.infer<typeof CreateDietPlanInputSchema>;

export const AddDietPlanDayInputSchema = z.object({
  dietPlanId: z.string().uuid(),
  dayNumber: z.coerce.number().int().positive(),
});
export type AddDietPlanDayInput = z.infer<typeof AddDietPlanDayInputSchema>;

export const AddDietPlanMealInputSchema = z.object({
  dietPlanDayId: z.string().uuid(),
  mealType: MealTypeSchema,
  plannedTime: z
    .string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, "HH:MM formatında olmalı")
    .optional(),
});
export type AddDietPlanMealInput = z.infer<typeof AddDietPlanMealInputSchema>;

// MVP kapsamında yalnızca foodItemId destekleniyor; recipeId, Recipes modülü
// eklendiğinde (BACKEND.md §6) devreye alınacak.
export const AddDietPlanMealItemInputSchema = z.object({
  dietPlanMealId: z.string().uuid(),
  foodItemId: z.string().uuid(),
  quantity: z.coerce.number().positive(),
  unit: MeasurementUnitSchema,
});
export type AddDietPlanMealItemInput = z.infer<typeof AddDietPlanMealItemInputSchema>;

export const DietPlanMealItemViewSchema = NutrientTotalsSchema.extend({
  id: z.string().uuid(),
  foodItemId: z.string().uuid(),
  foodName: z.string(),
  quantity: z.number(),
  unit: MeasurementUnitSchema,
});
export type DietPlanMealItemView = z.infer<typeof DietPlanMealItemViewSchema>;

export const DietPlanMealViewSchema = z.object({
  id: z.string().uuid(),
  mealType: MealTypeSchema,
  plannedTime: z.string().nullable(),
  items: z.array(DietPlanMealItemViewSchema),
  totals: NutrientTotalsSchema,
});
export type DietPlanMealView = z.infer<typeof DietPlanMealViewSchema>;

export const DietPlanDayViewSchema = z.object({
  id: z.string().uuid(),
  dayNumber: z.number().int(),
  meals: z.array(DietPlanMealViewSchema),
  totals: NutrientTotalsSchema,
});
export type DietPlanDayView = z.infer<typeof DietPlanDayViewSchema>;

export const DietPlanSummarySchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  dietitianId: z.string().uuid().nullable(),
  title: z.string(),
  startDate: z.string(),
  endDate: z.string().nullable(),
  targetCalories: z.number().int().nullable(),
  targetProteinG: z.number().nullable(),
  targetCarbsG: z.number().nullable(),
  targetFatG: z.number().nullable(),
  status: DietPlanStatusSchema,
});
export type DietPlanSummary = z.infer<typeof DietPlanSummarySchema>;

export const DietPlanDetailSchema = DietPlanSummarySchema.extend({
  days: z.array(DietPlanDayViewSchema),
  totals: NutrientTotalsSchema,
});
export type DietPlanDetail = z.infer<typeof DietPlanDetailSchema>;

export const DuplicateForNewCalorieTargetInputSchema = z.object({
  dietPlanId: z.string().uuid(),
  newTargetCalories: z.coerce.number().int().positive(),
  newTitle: z.string().min(1).max(200).optional(),
});
export type DuplicateForNewCalorieTargetInput = z.infer<typeof DuplicateForNewCalorieTargetInputSchema>;
