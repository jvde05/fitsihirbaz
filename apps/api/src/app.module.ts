import { resolve } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { FoodsModule } from "./foods/foods.module";
import { DietitiansModule } from "./dietitians/dietitians.module";
import { ClientsModule } from "./clients/clients.module";
import { DietPlansModule } from "./diet-plans/diet-plans.module";
import { PackagesModule } from "./packages/packages.module";
import { ProgressModule } from "./progress/progress.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { MessagesModule } from "./messages/messages.module";
import { ArticlesModule } from "./articles/articles.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [resolve(__dirname, "../../../.env"), resolve(process.cwd(), ".env")],
    }),
    PrismaModule,
    NotificationsModule,
    AuthModule,
    UsersModule,
    FoodsModule,
    DietitiansModule,
    ClientsModule,
    DietPlansModule,
    PackagesModule,
    ProgressModule,
    AppointmentsModule,
    MessagesModule,
    ArticlesModule,
  ],
})
export class AppModule {}
