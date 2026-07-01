import { createAuthRouter } from "../auth/auth.router";
import type { AuthService } from "../auth/auth.service";
import { createAdminFoodsRouter, createFoodsRouter } from "../foods/foods.router";
import type { FoodsService } from "../foods/foods.service";
import { router } from "./trpc";

export function createAppRouter(deps: { authService: AuthService; foodsService: FoodsService }) {
  return router({
    auth: createAuthRouter(deps.authService),
    foods: createFoodsRouter(deps.foodsService),
    admin: router({
      foods: createAdminFoodsRouter(deps.foodsService),
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
