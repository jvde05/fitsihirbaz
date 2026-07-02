import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { AddProgressLogInputSchema, ListProgressLogsInputSchema, ProgressLogSchema } from "@fit-sihirbaz/shared";
import { clientProcedure, protectedProcedure, router } from "../trpc/trpc";
import type { ProgressService } from "./progress.service";
import {
  ClientProfileNotFoundError,
  DietitianProfileNotFoundError,
  MissingClientIdError,
  ProgressAccessDeniedError,
} from "./progress.errors";

function mapProgressError(error: unknown): never {
  if (error instanceof ClientProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Danışan profili bulunamadı" });
  }
  if (error instanceof DietitianProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diyetisyen profili bulunamadı" });
  }
  if (error instanceof ProgressAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu danışanın ilerleme kayıtlarına erişiminiz yok" });
  }
  if (error instanceof MissingClientIdError) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "clientId zorunlu" });
  }
  throw error;
}

export function createProgressRouter(service: ProgressService) {
  return router({
    addLog: clientProcedure
      .input(AddProgressLogInputSchema)
      .output(ProgressLogSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.addLog(ctx.user.id, input);
        } catch (error) {
          mapProgressError(error);
        }
      }),

    list: protectedProcedure
      .input(ListProgressLogsInputSchema)
      .output(z.array(ProgressLogSchema))
      .query(async ({ ctx, input }) => {
        try {
          return await service.list(ctx.user.id, ctx.user.role, input.clientId);
        } catch (error) {
          mapProgressError(error);
        }
      }),
  });
}
