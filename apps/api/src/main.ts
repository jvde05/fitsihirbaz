import "reflect-metadata";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { AppModule } from "./app.module";
import { AuthService } from "./auth/auth.service";
import { TokenService } from "./auth/token.service";
import { UsersService } from "./users/users.service";
import { FoodsService } from "./foods/foods.service";
import { FoodSourcesService } from "./food-sources/food-sources.service";
import { RecipesService } from "./recipes/recipes.service";
import { DietitiansService } from "./dietitians/dietitians.service";
import { ClientsService } from "./clients/clients.service";
import { DietPlansService } from "./diet-plans/diet-plans.service";
import { PackagesService } from "./packages/packages.service";
import { OrdersService } from "./orders/orders.service";
import { PaymentsService } from "./payments/payments.service";
import { ReviewsService } from "./reviews/reviews.service";
import { ProgressService } from "./progress/progress.service";
import { AppointmentsService } from "./appointments/appointments.service";
import { MessagesService } from "./messages/messages.service";
import { ArticlesService } from "./articles/articles.service";
import { NotificationsService } from "./notifications/notifications.service";
import { ReferenceIntakesService } from "./reference-intakes/reference-intakes.service";
import { PostsService } from "./posts/posts.service";
import { createAppRouter } from "./trpc/app.router";
import { createContextFactory } from "./trpc/context";
import type { Env } from "./config/env.validation";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.use(cookieParser());
  const allowedOrigins = config
    .get("WEB_ORIGIN", { infer: true })
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins, credentials: true });

  // Akış paylaşımı ve profil fotoğrafları için yerel disk deposu; gerçek S3/R2 gelene
  // kadar /uploads altından statik servis edilir (alt klasörler uploads.controller.ts'te
  // istek anında oluşturulur — burada sadece üst dizin, statik servis için var olmalı).
  const uploadsRoot = resolve(__dirname, "../uploads");
  mkdirSync(uploadsRoot, { recursive: true });
  app.useStaticAssets(uploadsRoot, { prefix: "/uploads" });

  const appRouter = createAppRouter({
    authService: app.get(AuthService),
    usersService: app.get(UsersService),
    foodsService: app.get(FoodsService),
    foodSourcesService: app.get(FoodSourcesService),
    recipesService: app.get(RecipesService),
    dietitiansService: app.get(DietitiansService),
    clientsService: app.get(ClientsService),
    dietPlansService: app.get(DietPlansService),
    packagesService: app.get(PackagesService),
    ordersService: app.get(OrdersService),
    paymentsService: app.get(PaymentsService),
    reviewsService: app.get(ReviewsService),
    progressService: app.get(ProgressService),
    appointmentsService: app.get(AppointmentsService),
    messagesService: app.get(MessagesService),
    articlesService: app.get(ArticlesService),
    notificationsService: app.get(NotificationsService),
    referenceIntakesService: app.get(ReferenceIntakesService),
    postsService: app.get(PostsService),
  });
  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: createContextFactory({ tokenService: app.get(TokenService) }),
    }),
  );

  const port = config.get("API_PORT", { infer: true });
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`Fit Sihirbaz API http://localhost:${port}/trpc`);
}

bootstrap();
