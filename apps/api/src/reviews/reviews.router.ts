import { TRPCError } from "@trpc/server";
import { CreateReviewInputSchema, ListReviewsInputSchema, ReviewSchema } from "@fit-sihirbaz/shared";
import { z } from "zod";
import { clientProcedure, publicProcedure, router } from "../trpc/trpc";
import type { ReviewsService } from "./reviews.service";
import { ClientProfileNotFoundError, NoPaidOrderError } from "./reviews.errors";

function mapReviewError(error: unknown): never {
  if (error instanceof ClientProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Danışan profili bulunamadı" });
  }
  if (error instanceof NoPaidOrderError) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Yorum yapabilmek için bu diyetisyenden ödenmiş bir siparişiniz olmalı",
    });
  }
  throw error;
}

export function createReviewsRouter(service: ReviewsService) {
  return router({
    create: clientProcedure
      .input(CreateReviewInputSchema)
      .output(ReviewSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.create(ctx.user.id, input);
        } catch (error) {
          mapReviewError(error);
        }
      }),

    listForDietitian: publicProcedure
      .input(ListReviewsInputSchema)
      .output(z.array(ReviewSchema))
      .query(({ input }) => service.listForDietitian(input.dietitianId)),
  });
}
