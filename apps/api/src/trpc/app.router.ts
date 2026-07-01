import { createAuthRouter } from "../auth/auth.router";
import type { AuthService } from "../auth/auth.service";
import { createAdminFoodsRouter, createFoodsRouter } from "../foods/foods.router";
import type { FoodsService } from "../foods/foods.service";
import { createDietitiansRouter } from "../dietitians/dietitians.router";
import type { DietitiansService } from "../dietitians/dietitians.service";
import { createClientsRouter } from "../clients/clients.router";
import type { ClientsService } from "../clients/clients.service";
import { createDietPlansRouter } from "../diet-plans/diet-plans.router";
import type { DietPlansService } from "../diet-plans/diet-plans.service";
import { router } from "./trpc";

interface AppRouterDeps {
  authService: AuthService;
  foodsService: FoodsService;
  dietitiansService: DietitiansService;
  clientsService: ClientsService;
  dietPlansService: DietPlansService;
}

export function createAppRouter(deps: AppRouterDeps) {
  return router({
    auth: createAuthRouter(deps.authService),
    foods: createFoodsRouter(deps.foodsService),
    dietitians: createDietitiansRouter(deps.dietitiansService),
    clients: createClientsRouter(deps.clientsService),
    dietPlans: createDietPlansRouter(deps.dietPlansService),
    admin: router({
      foods: createAdminFoodsRouter(deps.foodsService),
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
