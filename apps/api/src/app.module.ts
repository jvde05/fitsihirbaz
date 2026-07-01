import { resolve } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { FoodsModule } from "./foods/foods.module";
import { DietitiansModule } from "./dietitians/dietitians.module";
import { ClientsModule } from "./clients/clients.module";
import { DietPlansModule } from "./diet-plans/diet-plans.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [resolve(__dirname, "../../../.env"), resolve(process.cwd(), ".env")],
    }),
    PrismaModule,
    AuthModule,
    FoodsModule,
    DietitiansModule,
    ClientsModule,
    DietPlansModule,
  ],
})
export class AppModule {}
