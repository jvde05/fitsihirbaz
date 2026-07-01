import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { ConfigService } from "@nestjs/config";
import cookieParser from "cookie-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { AppModule } from "./app.module";
import { AuthService } from "./auth/auth.service";
import { TokenService } from "./auth/token.service";
import { FoodsService } from "./foods/foods.service";
import { DietitiansService } from "./dietitians/dietitians.service";
import { ClientsService } from "./clients/clients.service";
import { DietPlansService } from "./diet-plans/diet-plans.service";
import { PackagesService } from "./packages/packages.service";
import { ProgressService } from "./progress/progress.service";
import { createAppRouter } from "./trpc/app.router";
import { createContextFactory } from "./trpc/context";
import type { Env } from "./config/env.validation";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService<Env, true>);

  app.use(cookieParser());
  // TODO: Faz 1'de NEXT_PUBLIC_API_URL'nin karşılığı olan web origin'i env'den okuyup whitelist'e alınmalı.
  app.enableCors({ origin: true, credentials: true });

  const appRouter = createAppRouter({
    authService: app.get(AuthService),
    foodsService: app.get(FoodsService),
    dietitiansService: app.get(DietitiansService),
    clientsService: app.get(ClientsService),
    dietPlansService: app.get(DietPlansService),
    packagesService: app.get(PackagesService),
    progressService: app.get(ProgressService),
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
