import { TRPCError } from "@trpc/server";
import { PublicUserSchema, UpdateProfileInputSchema } from "@fit-sihirbaz/shared";
import { protectedProcedure, router } from "../trpc/trpc";
import type { UsersService } from "./users.service";
import { UserNotFoundError } from "./users.errors";

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
  });
}
