import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AddDietPlanDayInputSchema,
  AddDietPlanMealInputSchema,
  AddDietPlanMealItemInputSchema,
  CreateDietPlanInputSchema,
  DietPlanDayViewSchema,
  DietPlanDetailSchema,
  DietPlanMealItemViewSchema,
  DietPlanMealViewSchema,
  DietPlanSummarySchema,
  DuplicateForNewCalorieTargetInputSchema,
  ListDietPlansInputSchema,
} from "@fit-sihirbaz/shared";
import { dietitianProcedure, protectedProcedure, router } from "../trpc/trpc";
import type { DietPlansService } from "./diet-plans.service";
import {
  ClientNotLinkedError,
  DietPlanAccessDeniedError,
  DietPlanDayNotFoundError,
  DietPlanFoodItemNotFoundError,
  DietPlanMealNotFoundError,
  DietPlanNotFoundError,
  DietitianProfileNotFoundError,
  EmptyDietPlanError,
  MissingClientIdError,
} from "./diet-plans.errors";

function mapDietPlanError(error: unknown): never {
  if (error instanceof DietPlanNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diyet planı bulunamadı" });
  }
  if (error instanceof DietPlanDayNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Gün bulunamadı" });
  }
  if (error instanceof DietPlanMealNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Öğün bulunamadı" });
  }
  if (error instanceof DietPlanFoodItemNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Besin bulunamadı" });
  }
  if (error instanceof DietPlanAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu diyet planına erişiminiz yok" });
  }
  if (error instanceof DietitianProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diyetisyen profili bulunamadı" });
  }
  if (error instanceof ClientNotLinkedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu danışan sizin danışanınız değil" });
  }
  if (error instanceof EmptyDietPlanError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Boş bir plan farklı kaloriye ayarlanamaz" });
  }
  if (error instanceof MissingClientIdError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "clientId zorunlu" });
  }
  throw error;
}

export function createDietPlansRouter(service: DietPlansService) {
  return router({
    create: dietitianProcedure
      .input(CreateDietPlanInputSchema)
      .output(DietPlanSummarySchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.create(ctx.user.id, input);
        } catch (error) {
          mapDietPlanError(error);
        }
      }),

    addDay: dietitianProcedure
      .input(AddDietPlanDayInputSchema)
      .output(DietPlanDayViewSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.addDay(ctx.user.id, input);
        } catch (error) {
          mapDietPlanError(error);
        }
      }),

    addMeal: dietitianProcedure
      .input(AddDietPlanMealInputSchema)
      .output(DietPlanMealViewSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.addMeal(ctx.user.id, input);
        } catch (error) {
          mapDietPlanError(error);
        }
      }),

    addMealItem: dietitianProcedure
      .input(AddDietPlanMealItemInputSchema)
      .output(DietPlanMealItemViewSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.addMealItem(ctx.user.id, input);
        } catch (error) {
          mapDietPlanError(error);
        }
      }),

    list: protectedProcedure
      .input(ListDietPlansInputSchema)
      .output(z.array(DietPlanSummarySchema))
      .query(async ({ ctx, input }) => {
        try {
          return await service.list(ctx.user.id, ctx.user.role, input.clientId);
        } catch (error) {
          mapDietPlanError(error);
        }
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(DietPlanDetailSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await service.getById(ctx.user.id, ctx.user.role, input.id);
        } catch (error) {
          mapDietPlanError(error);
        }
      }),

    duplicateForNewCalorieTarget: dietitianProcedure
      .input(DuplicateForNewCalorieTargetInputSchema)
      .output(DietPlanDetailSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.duplicateForNewCalorieTarget(ctx.user.id, input);
        } catch (error) {
          mapDietPlanError(error);
        }
      }),
  });
}
