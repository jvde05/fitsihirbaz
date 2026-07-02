import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AdminListUsersInputSchema,
  AdminListUsersResultSchema,
  AdminSetUserActiveInputSchema,
  AdminUserSummarySchema,
  PublicUserSchema,
  RegisterPushTokenInputSchema,
  UpdateProfileInputSchema,
} from "@fit-sihirbaz/shared";
import { adminProcedure, protectedProcedure, router } from "../trpc/trpc";
import type { UsersService } from "./users.service";
import { CannotDeactivateSelfError, UserNotFoundError } from "./users.errors";

export function createUsersRouter(service: UsersService) {
  return router({
    updateProfile: protectedProcedure
      .input(UpdateProfileInputSchema)
      .output(PublicUserSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.updateProfile(ctx.user.id, input);
        } catch (error) {
          if (error instanceof UserNotFoundError) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Kullanıcı bulunamadı" });
          }
          throw error;
        }
      }),

    registerPushToken: protectedProcedure
      .input(RegisterPushTokenInputSchema)
      .output(z.void())
      .mutation(async ({ ctx, input }) => {
        try {
          await service.registerPushToken(ctx.user.id, input.token);
        } catch (error) {
          if (error instanceof UserNotFoundError) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Kullanıcı bulunamadı" });
          }
          throw error;
        }
      }),
  });
}

export function createAdminUsersRouter(service: UsersService) {
  return router({
    list: adminProcedure
      .input(AdminListUsersInputSchema)
      .output(AdminListUsersResultSchema)
      .query(({ input }) => service.adminList(input)),

    setActive: adminProcedure
      .input(AdminSetUserActiveInputSchema)
      .output(AdminUserSummarySchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.adminSetActive(ctx.user.id, input.id, input.isActive);
        } catch (error) {
          if (error instanceof UserNotFoundError) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Kullanıcı bulunamadı" });
          }
          if (error instanceof CannotDeactivateSelfError) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Kendi hesabınızı pasife alamazsınız" });
          }
          throw error;
        }
      }),
  });
}
