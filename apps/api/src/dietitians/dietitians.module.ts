import { Module } from "@nestjs/common";
import { DietitiansService } from "./dietitians.service";

@Module({
  providers: [DietitiansService],
  exports: [DietitiansService],
})
export class DietitiansModule {}
