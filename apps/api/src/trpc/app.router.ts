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
import { createPackagesRouter } from "../packages/packages.router";
import type { PackagesService } from "../packages/packages.service";
import { createProgressRouter } from "../progress/progress.router";
import type { ProgressService } from "../progress/progress.service";
import { createAppointmentsRouter } from "../appointments/appointments.router";
import type { AppointmentsService } from "../appointments/appointments.service";
import { createMessagesRouter } from "../messages/messages.router";
import type { MessagesService } from "../messages/messages.service";
import { createArticlesRouter } from "../articles/articles.router";
import type { ArticlesService } from "../articles/articles.service";
import { router } from "./trpc";

interface AppRouterDeps {
  authService: AuthService;
  foodsService: FoodsService;
  dietitiansService: DietitiansService;
  clientsService: ClientsService;
  dietPlansService: DietPlansService;
  packagesService: PackagesService;
  progressService: ProgressService;
  appointmentsService: AppointmentsService;
  messagesService: MessagesService;
  articlesService: ArticlesService;
}

export function createAppRouter(deps: AppRouterDeps) {
  return router({
    auth: createAuthRouter(deps.authService),
    foods: createFoodsRouter(deps.foodsService),
    dietitians: createDietitiansRouter(deps.dietitiansService),
    clients: createClientsRouter(deps.clientsService),
    dietPlans: createDietPlansRouter(deps.dietPlansService),
    packages: createPackagesRouter(deps.packagesService),
    progress: createProgressRouter(deps.progressService),
    appointments: createAppointmentsRouter(deps.appointmentsService),
    messages: createMessagesRouter(deps.messagesService),
    articles: createArticlesRouter(deps.articlesService),
    admin: router({
      foods: createAdminFoodsRouter(deps.foodsService),
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
