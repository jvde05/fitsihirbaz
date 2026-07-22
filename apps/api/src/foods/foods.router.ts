import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AdminVerifyFoodInputSchema,
  FoodCreateInputSchema,
  FoodDetailSchema,
  FoodSearchInputSchema,
  FoodSearchResultSchema,
  FoodUpdateImageInputSchema,
} from "@fit-sihirbaz/shared";
import { adminProcedure, dietitianOrAdminProcedure, protectedProcedure, router } from "../trpc/trpc";
import type { FoodsService } from "./foods.service";
import { FoodNotFoundError } from "./foods.errors";

function mapFoodNotFound(error: unknown): never {
  if (error instanceof FoodNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Besin bulunamadı" });
  }
  throw error;
}

export function createFoodsRouter(foodsService: FoodsService) {
  return router({
    search: protectedProcedure
      .input(FoodSearchInputSchema)
      .output(FoodSearchResultSchema)
      .query(({ input }) => foodsService.search(input)),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(FoodDetailSchema)
      .query(async ({ input }) => {
        try {
          return await foodsService.getById(input.id);
        } catch (error) {
          mapFoodNotFound(error);
        }
      }),

    create: dietitianOrAdminProcedure
      .input(FoodCreateInputSchema)
      .output(FoodDetailSchema)
      .mutation(({ input, ctx }) => foodsService.create(input, ctx.user.id)),

    updateImage: dietitianOrAdminProcedure
      .input(FoodUpdateImageInputSchema)
      .output(FoodDetailSchema)
      .mutation(async ({ input }) => {
        try {
          return await foodsService.updateImage(input.id, input.imageUrl);
        } catch (error) {
          mapFoodNotFound(error);
        }
      }),
  });
}

export function createAdminFoodsRouter(foodsService: FoodsService) {
  return router({
    verify: adminProcedure
      .input(AdminVerifyFoodInputSchema)
      .output(FoodDetailSchema)
      .mutation(async ({ input }) => {
        try {
          return await foodsService.verify(input.id, input.approve);
        } catch (error) {
          mapFoodNotFound(error);
        }
      }),
  });
}
