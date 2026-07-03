import { Module } from "@nestjs/common";
import { ReferenceIntakesService } from "./reference-intakes.service";

@Module({
  providers: [ReferenceIntakesService],
  exports: [ReferenceIntakesService],
})
export class ReferenceIntakesModule {}
