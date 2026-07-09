import { z } from "zod";
import { optionalCoerced } from "./common";

export const FoodSourceSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  citation: z.string(),
  url: z.string().nullable(),
  foodItemCount: z.number().int(),
});
export type FoodSource = z.infer<typeof FoodSourceSchema>;

export const UpsertFoodSourceInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, "Kaynak adı zorunlu").max(200),
  citation: z.string().min(1, "Atıf metni zorunlu").max(500),
  url: optionalCoerced(z.string().url("Geçerli bir URL girin").max(500)),
});
export type UpsertFoodSourceInput = z.infer<typeof UpsertFoodSourceInputSchema>;

export const DeleteFoodSourceInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteFoodSourceInput = z.infer<typeof DeleteFoodSourceInputSchema>;
