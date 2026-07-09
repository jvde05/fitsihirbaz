import { TRPCError } from "@trpc/server";
import { FoodSourceSchema, UpsertFoodSourceInputSchema, DeleteFoodSourceInputSchema } from "@fit-sihirbaz/shared";
import { z } from "zod";
import { adminProcedure, router } from "../trpc/trpc";
import type { FoodSourcesService } from "./food-sources.service";
import { FoodSourceInUseError, FoodSourceNotFoundError } from "./food-sources.errors";

function mapFoodSourceError(error: unknown): never {
  if (error instanceof FoodSourceNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Kaynak bulunamadı" });
  }
  if (error instanceof FoodSourceInUseError) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "Bu kaynağa bağlı besinler var, önce onları başka bir kaynağa taşıyın veya silin",
    });
  }
  throw error;
}

export function createAdminFoodSourcesRouter(service: FoodSourcesService) {
  return router({
    list: adminProcedure.output(z.array(FoodSourceSchema)).query(() => service.list()),

    upsert: adminProcedure
      .input(UpsertFoodSourceInputSchema)
      .output(FoodSourceSchema)
      .mutation(async ({ input }) => {
        try {
          return await service.upsert(input);
        } catch (error) {
          mapFoodSourceError(error);
        }
      }),

    delete: adminProcedure
      .input(DeleteFoodSourceInputSchema)
      .output(z.object({ success: z.literal(true) }))
      .mutation(async ({ input }) => {
        try {
          await service.delete(input.id);
          return { success: true as const };
        } catch (error) {
          mapFoodSourceError(error);
        }
      }),
  });
}
