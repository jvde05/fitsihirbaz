import type { MealType } from "./schemas";

// Web ve mobil arasında paylaşılan görüntüleme etiketleri (MOBIL.md §7).
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: "Kahvaltı",
  LUNCH: "Öğle Yemeği",
  DINNER: "Akşam Yemeği",
  SNACK: "Ara Öğün",
};
