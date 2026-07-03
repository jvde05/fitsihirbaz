import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { AppModule } from "./app.module";
import { AuthService } from "./auth/auth.service";
import { TokenService } from "./auth/token.service";
import { UsersService } from "./users/users.service";
import { FoodsService } from "./foods/foods.service";
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
import { createAppRouter } from "./trpc/app.router";
import { createContextFactory } from "./trpc/context";
import type { Env } from "./config/env.validation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.use(cookieParser());
  const allowedOrigins = config
    .get("WEB_ORIGIN", { infer: true })
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  app.enableCors({ origin: allowedOrigins, credentials: true });

  const appRouter = createAppRouter({
    authService: app.get(AuthService),
    usersService: app.get(UsersService),
    foodsService: app.get(FoodsService),
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
