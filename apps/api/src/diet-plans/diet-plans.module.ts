import { Module } from "@nestjs/common";
import { DietPlansService } from "./diet-plans.service";

@Module({
  providers: [DietPlansService],
  exports: [DietPlansService],
})
export class DietPlansModule {}
