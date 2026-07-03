import type { MealType, ReferenceLifeStage, ReferenceSex } from "./schemas";

// Web ve mobil arasında paylaşılan görüntüleme etiketleri (MOBIL.md §7).
export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  BREAKFAST: "Kahvaltı",
  LUNCH: "Öğle Yemeği",
  DINNER: "Akşam Yemeği",
  SNACK: "Ara Öğün",
};

export const REFERENCE_SEX_LABELS: Record<ReferenceSex, string> = {
  MALE: "Erkek",
  FEMALE: "Kadın",
  ALL: "Tümü",
};

export const REFERENCE_LIFE_STAGE_LABELS: Record<ReferenceLifeStage, string> = {
  NONE: "-",
  PREGNANCY: "Gebelik",
  LACTATION: "Emzirme",
};

// Serbest metin nutrient kodları için bilinen etiketler; eşleşme yoksa kod olduğu gibi gösterilir.
export const REFERENCE_NUTRIENT_LABELS: Record<string, string> = {
  ENERGY: "Enerji",
  PROTEIN: "Protein",
  CARBS: "Karbonhidrat",
  FAT: "Yağ",
  FIBER: "Lif",
};
