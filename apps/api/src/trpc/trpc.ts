import { TRPCError, initTRPC } from "@trpc/server";
import type { Role } from "@fit-sihirbaz/shared";
import type { Context } from "./context";

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

const isAuthed = middleware(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: "Giriş yapmanız gerekiyor" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(isAuthed);

function requireRole(...roles: Role[]) {
  return middleware(({ ctx, next }) => {
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Giriş yapmanız gerekiyor" });
    }
    if (!roles.includes(ctx.user.role)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Bu işlem için yetkiniz yok" });
    }
    return next({ ctx: { ...ctx, user: ctx.user } });
  });
}

export const adminProcedure = t.procedure.use(requireRole("ADMIN"));
export const dietitianProcedure = t.procedure.use(requireRole("DIETITIAN"));
export const clientProcedure = t.procedure.use(requireRole("CLIENT"));
export const dietitianOrAdminProcedure = t.procedure.use(requireRole("DIETITIAN", "ADMIN"));
