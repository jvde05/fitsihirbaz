import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { CreateOrderInputSchema, OrderSchema } from "@fit-sihirbaz/shared";
import { clientProcedure, dietitianProcedure, router } from "../trpc/trpc";
import type { OrdersService } from "./orders.service";
import { ClientProfileNotFoundError, DietitianProfileNotFoundError, PackageNotFoundError } from "./orders.errors";

function mapOrderError(error: unknown): never {
  if (error instanceof ClientProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Danışan profili bulunamadı" });
  }
  if (error instanceof DietitianProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diyetisyen profili bulunamadı" });
  }
  if (error instanceof PackageNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Paket bulunamadı" });
  }
  throw error;
}

export function createOrdersRouter(service: OrdersService) {
  return router({
    create: clientProcedure
      .input(CreateOrderInputSchema)
      .output(OrderSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.create(ctx.user.id, input);
        } catch (error) {
          mapOrderError(error);
        }
      }),

    listForClient: clientProcedure.output(z.array(OrderSchema)).query(async ({ ctx }) => {
      try {
        return await service.listForClient(ctx.user.id);
      } catch (error) {
        mapOrderError(error);
      }
    }),

    listForDietitian: dietitianProcedure.output(z.array(OrderSchema)).query(async ({ ctx }) => {
      try {
        return await service.listForDietitian(ctx.user.id);
      } catch (error) {
        mapOrderError(error);
      }
    }),
  });
}
