import { TRPCError } from "@trpc/server";
import {
  DeleteReferenceIntakeInputSchema,
  FindReferenceIntakesForProfileInputSchema,
  ListReferenceIntakesInputSchema,
  ReferenceIntakeSchema,
  UpsertReferenceIntakeInputSchema,
} from "@fit-sihirbaz/shared";
import { z } from "zod";
import { adminProcedure, publicProcedure, router } from "../trpc/trpc";
import type { ReferenceIntakesService } from "./reference-intakes.service";
import { ReferenceIntakeNotFoundError } from "./reference-intakes.errors";

function mapReferenceIntakeError(error: unknown): never {
  if (error instanceof ReferenceIntakeNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Referans değer bulunamadı" });
  }
  throw error;
}

export function createReferenceIntakesRouter(service: ReferenceIntakesService) {
  return router({
    list: publicProcedure
      .input(ListReferenceIntakesInputSchema)
      .output(z.array(ReferenceIntakeSchema))
      .query(({ input }) => service.list(input)),

    findForProfile: publicProcedure
      .input(FindReferenceIntakesForProfileInputSchema)
      .output(z.array(ReferenceIntakeSchema))
      .query(({ input }) => service.findForProfile(input)),
  });
}

export function createAdminReferenceIntakesRouter(service: ReferenceIntakesService) {
  return router({
    upsert: adminProcedure
      .input(UpsertReferenceIntakeInputSchema)
      .output(ReferenceIntakeSchema)
      .mutation(async ({ input }) => {
        try {
          return await service.upsert(input);
        } catch (error) {
          mapReferenceIntakeError(error);
        }
      }),

    delete: adminProcedure
      .input(DeleteReferenceIntakeInputSchema)
      .output(z.object({ success: z.literal(true) }))
      .mutation(async ({ input }) => {
        try {
          await service.delete(input.id);
          return { success: true as const };
        } catch (error) {
          mapReferenceIntakeError(error);
        }
      }),
  });
}
