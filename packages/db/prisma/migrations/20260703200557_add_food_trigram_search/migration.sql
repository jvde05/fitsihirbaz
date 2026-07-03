-- Typo-toleranslı besin araması için (foods.service.ts search())
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "FoodItem_name_trgm_idx" ON "FoodItem" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "FoodItem_nameEn_trgm_idx" ON "FoodItem" USING GIN ("nameEn" gin_trgm_ops);
