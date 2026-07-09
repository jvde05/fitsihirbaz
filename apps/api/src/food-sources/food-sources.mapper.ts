import type { FoodSource as FoodSourceRow } from "@fit-sihirbaz/db";
import type { FoodSource } from "@fit-sihirbaz/shared";

export function toFoodSource(row: FoodSourceRow & { _count: { foodItems: number } }): FoodSource {
  return {
    id: row.id,
    name: row.name,
    citation: row.citation,
    url: row.url,
    foodItemCount: row._count.foodItems,
  };
}
