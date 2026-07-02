import { createAuthRouter } from "../auth/auth.router";
import type { AuthService } from "../auth/auth.service";
import { createAdminUsersRouter, createUsersRouter } from "../users/users.router";
import type { UsersService } from "../users/users.service";
import { createAdminFoodsRouter, createFoodsRouter } from "../foods/foods.router";
import type { FoodsService } from "../foods/foods.service";
import { createRecipesRouter } from "../recipes/recipes.router";
import type { RecipesService } from "../recipes/recipes.service";
import { createAdminDietitiansRouter, createDietitiansRouter } from "../dietitians/dietitians.router";
import type { DietitiansService } from "../dietitians/dietitians.service";
import { createClientsRouter } from "../clients/clients.router";
import type { ClientsService } from "../clients/clients.service";
import { createDietPlansRouter } from "../diet-plans/diet-plans.router";
import type { DietPlansService } from "../diet-plans/diet-plans.service";
import { createPackagesRouter } from "../packages/packages.router";
import type { PackagesService } from "../packages/packages.service";
import { createOrdersRouter } from "../orders/orders.router";
import type { OrdersService } from "../orders/orders.service";
import { createPaymentsRouter } from "../payments/payments.router";
import type { PaymentsService } from "../payments/payments.service";
import { createReviewsRouter } from "../reviews/reviews.router";
import type { ReviewsService } from "../reviews/reviews.service";
import { createProgressRouter } from "../progress/progress.router";
import type { ProgressService } from "../progress/progress.service";
import { createAppointmentsRouter } from "../appointments/appointments.router";
import type { AppointmentsService } from "../appointments/appointments.service";
import { createMessagesRouter } from "../messages/messages.router";
import type { MessagesService } from "../messages/messages.service";
import { createArticlesRouter } from "../articles/articles.router";
import type { ArticlesService } from "../articles/articles.service";
import { createNotificationsRouter } from "../notifications/notifications.router";
import type { NotificationsService } from "../notifications/notifications.service";
import { router } from "./trpc";

interface AppRouterDeps {
  authService: AuthService;
  usersService: UsersService;
  foodsService: FoodsService;
  recipesService: RecipesService;
  dietitiansService: DietitiansService;
  clientsService: ClientsService;
  dietPlansService: DietPlansService;
  packagesService: PackagesService;
  ordersService: OrdersService;
  paymentsService: PaymentsService;
  reviewsService: ReviewsService;
  progressService: ProgressService;
  appointmentsService: AppointmentsService;
  messagesService: MessagesService;
  articlesService: ArticlesService;
  notificationsService: NotificationsService;
}

export function createAppRouter(deps: AppRouterDeps) {
  return router({
    auth: createAuthRouter(deps.authService),
    users: createUsersRouter(deps.usersService),
    foods: createFoodsRouter(deps.foodsService),
    recipes: createRecipesRouter(deps.recipesService),
    dietitians: createDietitiansRouter(deps.dietitiansService),
    clients: createClientsRouter(deps.clientsService),
    dietPlans: createDietPlansRouter(deps.dietPlansService),
    packages: createPackagesRouter(deps.packagesService),
    orders: createOrdersRouter(deps.ordersService),
    payments: createPaymentsRouter(deps.paymentsService),
    reviews: createReviewsRouter(deps.reviewsService),
    progress: createProgressRouter(deps.progressService),
    appointments: createAppointmentsRouter(deps.appointmentsService),
    messages: createMessagesRouter(deps.messagesService),
    articles: createArticlesRouter(deps.articlesService),
    notifications: createNotificationsRouter(deps.notificationsService),
    admin: router({
      foods: createAdminFoodsRouter(deps.foodsService),
      dietitians: createAdminDietitiansRouter(deps.dietitiansService),
      users: createAdminUsersRouter(deps.usersService),
    }),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
