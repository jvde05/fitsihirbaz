import { resolve } from "node:path";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { RateLimiterModule } from "./rate-limit/rate-limiter.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { FoodsModule } from "./foods/foods.module";
import { FoodSourcesModule } from "./food-sources/food-sources.module";
import { RecipesModule } from "./recipes/recipes.module";
import { DietitiansModule } from "./dietitians/dietitians.module";
import { ClientsModule } from "./clients/clients.module";
import { DietPlansModule } from "./diet-plans/diet-plans.module";
import { PackagesModule } from "./packages/packages.module";
import { OrdersModule } from "./orders/orders.module";
import { PaymentsModule } from "./payments/payments.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { ProgressModule } from "./progress/progress.module";
import { AppointmentsModule } from "./appointments/appointments.module";
import { MessagesModule } from "./messages/messages.module";
import { ArticlesModule } from "./articles/articles.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { ReferenceIntakesModule } from "./reference-intakes/reference-intakes.module";
import { UploadsModule } from "./uploads/uploads.module";
import { PostsModule } from "./posts/posts.module";
import { JobsModule } from "./jobs/jobs.module";
import { validateEnv } from "./config/env.validation";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      envFilePath: [resolve(__dirname, "../../../.env"), resolve(process.cwd(), ".env")],
    }),
    PrismaModule,
    RateLimiterModule,
    NotificationsModule,
    JobsModule,
    AuthModule,
    UsersModule,
    FoodsModule,
    FoodSourcesModule,
    RecipesModule,
    DietitiansModule,
    ClientsModule,
    DietPlansModule,
    PackagesModule,
    OrdersModule,
    PaymentsModule,
    ReviewsModule,
    ProgressModule,
    AppointmentsModule,
    MessagesModule,
    ArticlesModule,
    ReferenceIntakesModule,
    UploadsModule,
    PostsModule,
  ],
})
export class AppModule {}
