import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  ClientProfileSchema,
  DietitianPublicSummarySchema,
  LinkToDietitianInputSchema,
  UpdateClientProfileInputSchema,
} from "@fit-sihirbaz/shared";
import { clientProcedure, dietitianProcedure, router } from "../trpc/trpc";
import type { ClientsService } from "./clients.service";
import {
  AlreadyLinkedError,
  ClientProfileNotFoundError,
  ClientUserNotFoundError,
  DietitianNotFoundError,
} from "./clients.errors";

export function createClientsRouter(service: ClientsService) {
  return router({
    getProfile: clientProcedure.output(ClientProfileSchema).query(async ({ ctx }) => {
      try {
        return await service.getMyProfile(ctx.user.id);
      } catch (error) {
        if (error instanceof ClientProfileNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Danışan profili bulunamadı" });
        }
        throw error;
      }
    }),

    updateProfile: clientProcedure
      .input(UpdateClientProfileInputSchema)
      .output(ClientProfileSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.updateMyProfile(ctx.user.id, input);
        } catch (error) {
          if (error instanceof ClientProfileNotFoundError) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Danışan profili bulunamadı" });
          }
          throw error;
        }
      }),

    getMyDietitians: clientProcedure.output(z.array(DietitianPublicSummarySchema)).query(async ({ ctx }) => {
      try {
        return await service.getMyDietitians(ctx.user.id);
      } catch (error) {
        if (error instanceof ClientProfileNotFoundError) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Danışan profili bulunamadı" });
        }
        throw error;
      }
    }),

    linkToDietitian: dietitianProcedure
      .input(LinkToDietitianInputSchema)
      .output(z.object({ success: z.literal(true) }))
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.linkToDietitian(ctx.user.id, input.clientEmail);
        } catch (error) {
          if (error instanceof ClientUserNotFoundError) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Bu e-posta ile kayıtlı bir danışan bulunamadı",
            });
          }
          if (error instanceof AlreadyLinkedError) {
            throw new TRPCError({ code: "CONFLICT", message: "Bu danışan zaten sizin danışanınız" });
          }
          if (error instanceof DietitianNotFoundError) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Diyetisyen profili bulunamadı" });
          }
          throw error;
        }
      }),
  });
}
