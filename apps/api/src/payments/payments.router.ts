import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  InitiatePaymentInputSchema,
  InitiatePaymentResultSchema,
  MockCheckoutDetailsSchema,
  PaymentSchema,
  SimulatePaymentOutcomeInputSchema,
} from "@fit-sihirbaz/shared";
import { clientProcedure, router } from "../trpc/trpc";
import type { PaymentsService } from "./payments.service";
import {
  NotMockPaymentError,
  OrderAccessDeniedError,
  OrderNotFoundError,
  OrderNotPendingError,
  PaymentNotFoundError,
} from "./payments.errors";

function mapPaymentError(error: unknown): never {
  if (error instanceof OrderNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Sipariş bulunamadı" });
  }
  if (error instanceof PaymentNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Ödeme bulunamadı" });
  }
  if (error instanceof OrderAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu siparişe erişiminiz yok" });
  }
  if (error instanceof OrderNotPendingError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Bu sipariş için ödeme başlatılamıyor" });
  }
  if (error instanceof NotMockPaymentError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Bu ödeme mock sağlayıcıya ait değil" });
  }
  throw error;
}

export function createPaymentsRouter(service: PaymentsService) {
  return router({
    initiate: clientProcedure
      .input(InitiatePaymentInputSchema)
      .output(InitiatePaymentResultSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.initiate(ctx.user.id, input);
        } catch (error) {
          mapPaymentError(error);
        }
      }),

    getMockCheckoutDetails: clientProcedure
      .input(z.object({ paymentId: z.string().uuid() }))
      .output(MockCheckoutDetailsSchema)
      .query(async ({ ctx, input }) => {
        try {
          return await service.getMockCheckoutDetails(ctx.user.id, input.paymentId);
        } catch (error) {
          mapPaymentError(error);
        }
      }),

    simulateOutcome: clientProcedure
      .input(SimulatePaymentOutcomeInputSchema)
      .output(PaymentSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.simulateOutcome(ctx.user.id, input.paymentId, input.outcome);
        } catch (error) {
          mapPaymentError(error);
        }
      }),
  });
}
