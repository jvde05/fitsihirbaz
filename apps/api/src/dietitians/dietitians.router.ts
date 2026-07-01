import { TRPCError } from "@trpc/server";
import {
  ClientSummarySchema,
  DietitianProfileSchema,
  DietitianPublicSummarySchema,
  DietitianSearchInputSchema,
  DietitianSearchResultSchema,
  UpdateDietitianProfileInputSchema,
} from "@fit-sihirbaz/shared";
import { z } from "zod";
import { dietitianProcedure, publicProcedure, router } from "../trpc/trpc";
import type { DietitiansService } from "./dietitians.service";
import { DietitianProfileNotFoundError } from "./dietitians.errors";

function mapProfileNotFound(error: unknown): never {
  if (error instanceof DietitianProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diyetisyen profili bulunamadı" });
  }
  throw error;
}

export function createDietitiansRouter(service: DietitiansService) {
  return router({
    getProfile: dietitianProcedure.output(DietitianProfileSchema).query(async ({ ctx }) => {
      try {
        return await service.getMyProfile(ctx.user.id);
      } catch (error) {
        mapProfileNotFound(error);
      }
    }),

    updateProfile: dietitianProcedure
      .input(UpdateDietitianProfileInputSchema)
      .output(DietitianProfileSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.updateMyProfile(ctx.user.id, input);
        } catch (error) {
          mapProfileNotFound(error);
        }
      }),

    search: publicProcedure
      .input(DietitianSearchInputSchema)
      .output(DietitianSearchResultSchema)
      .query(({ input }) => service.search(input)),

    getPublicProfile: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(DietitianPublicSummarySchema)
      .query(async ({ input }) => {
        try {
          return await service.getPublicProfile(input.id);
        } catch (error) {
          mapProfileNotFound(error);
        }
      }),

    getMyClients: dietitianProcedure.output(z.array(ClientSummarySchema)).query(async ({ ctx }) => {
      try {
        return await service.getMyClients(ctx.user.id);
      } catch (error) {
        mapProfileNotFound(error);
      }
    }),
  });
}
