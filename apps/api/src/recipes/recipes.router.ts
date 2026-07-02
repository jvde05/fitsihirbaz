import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  RecipeCreateInputSchema,
  RecipeDetailSchema,
  RecipeListInputSchema,
  RecipeSummarySchema,
  RecipeUpdateInputSchema,
} from "@fit-sihirbaz/shared";
import { dietitianOrAdminProcedure, protectedProcedure, router } from "../trpc/trpc";
import type { RecipesService } from "./recipes.service";
import {
  RecipeAccessDeniedError,
  RecipeIngredientFoodItemNotFoundError,
  RecipeNotFoundError,
} from "./recipes.errors";

function mapRecipeError(error: unknown): never {
  if (error instanceof RecipeNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Tarif bulunamadı" });
  }
  if (error instanceof RecipeAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu tarif üzerinde işlem yapma yetkiniz yok" });
  }
  if (error instanceof RecipeIngredientFoodItemNotFoundError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Malzemelerden biri bulunamadı" });
  }
  throw error;
}

export function createRecipesRouter(recipesService: RecipesService) {
  return router({
    create: dietitianOrAdminProcedure
      .input(RecipeCreateInputSchema)
      .output(RecipeDetailSchema)
      .mutation(async ({ input, ctx }) => {
        try {
          return await recipesService.create(ctx.user.id, input);
        } catch (error) {
          mapRecipeError(error);
        }
      }),

    update: dietitianOrAdminProcedure
      .input(RecipeUpdateInputSchema)
      .output(RecipeDetailSchema)
      .mutation(async ({ input, ctx }) => {
        try {
          return await recipesService.update(ctx.user.id, ctx.user.role, input);
        } catch (error) {
          mapRecipeError(error);
        }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(RecipeDetailSchema)
      .query(async ({ input, ctx }) => {
        try {
          return await recipesService.getById(ctx.user.id, ctx.user.role, input.id);
        } catch (error) {
          mapRecipeError(error);
        }
      }),

    list: protectedProcedure
      .input(RecipeListInputSchema)
      .output(z.array(RecipeSummarySchema))
      .query(({ input, ctx }) => recipesService.list(ctx.user.id, ctx.user.role, input.mineOnly)),
  });
}
