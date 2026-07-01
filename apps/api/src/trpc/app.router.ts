import { createAuthRouter } from "../auth/auth.router";
import type { AuthService } from "../auth/auth.service";
import { router } from "./trpc";

export function createAppRouter(deps: { authService: AuthService }) {
  return router({
    auth: createAuthRouter(deps.authService),
  });
}

export type AppRouter = ReturnType<typeof createAppRouter>;
