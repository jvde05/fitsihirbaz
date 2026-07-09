import { Module } from "@nestjs/common";
import { FoodSourcesService } from "./food-sources.service";

@Module({
  providers: [FoodSourcesService],
  exports: [FoodSourcesService],
})
export class FoodSourcesModule {}
