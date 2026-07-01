import { z } from "zod";
import { optionalCoerced } from "./common";

export const FoodSearchInputSchema = z.object({
  query: z.string().trim().min(1, "Arama terimi girin").max(100),
  category: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type FoodSearchInput = z.infer<typeof FoodSearchInputSchema>;

export const FoodSummarySchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  nameEn: z.string().nullable(),
  category: z.string(),
  servingDescription: z.string().nullable(),
  servingGramWeight: z.number().nullable(),
  isVerified: z.boolean(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
});
export type FoodSummary = z.infer<typeof FoodSummarySchema>;

export const FoodSearchResultSchema = z.object({
  items: z.array(FoodSummarySchema),
  total: z.number().int(),
});
export type FoodSearchResult = z.infer<typeof FoodSearchResultSchema>;

export const FoodDetailSchema = FoodSummarySchema.extend({
  sourceId: z.string().uuid(),
  sourceName: z.string(),
  fiber: z.number().nullable(),
  sugar: z.number().nullable(),
  glycemicIndex: z.number().int().nullable(),
  oracValue: z.number().nullable(),
  vitamins: z.record(z.number()).nullable(),
  minerals: z.record(z.number()).nullable(),
  aminoAcids: z.record(z.number()).nullable(),
  fattyAcids: z.record(z.number()).nullable(),
});
export type FoodDetail = z.infer<typeof FoodDetailSchema>;

// Diyetisyen/admin kendi özel besinini eklerken kullanılır; isVerified=false başlar (admin.foods.verify onaylar).
export const FoodCreateInputSchema = z.object({
  name: z.string().min(1, "Besin adı zorunlu").max(200),
  nameEn: z.string().min(1).max(200).optional(),
  category: z.string().min(1, "Kategori zorunlu").max(100),
  servingDescription: z.string().min(1).max(100).optional(),
  servingGramWeight: optionalCoerced(z.coerce.number().positive()),
  calories: z.coerce.number().nonnegative(),
  protein: z.coerce.number().nonnegative(),
  carbs: z.coerce.number().nonnegative(),
  fat: z.coerce.number().nonnegative(),
  fiber: optionalCoerced(z.coerce.number().nonnegative()),
  sugar: optionalCoerced(z.coerce.number().nonnegative()),
});
export type FoodCreateInput = z.infer<typeof FoodCreateInputSchema>;

export const AdminVerifyFoodInputSchema = z.object({
  id: z.string().uuid(),
  approve: z.boolean(),
});
export type AdminVerifyFoodInput = z.infer<typeof AdminVerifyFoodInputSchema>;
