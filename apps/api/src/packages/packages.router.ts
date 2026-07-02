import { TRPCError } from "@trpc/server";
import {
  BrowsePackagesInputSchema,
  BrowsePackagesResultSchema,
  CreatePackageInputSchema,
  PackageSchema,
  PackageWithDietitianSchema,
  UpdatePackageInputSchema,
} from "@fit-sihirbaz/shared";
import { z } from "zod";
import { dietitianProcedure, publicProcedure, router } from "../trpc/trpc";
import type { PackagesService } from "./packages.service";
import { DietitianProfileNotFoundError, PackageAccessDeniedError, PackageNotFoundError } from "./packages.errors";

function mapPackageError(error: unknown): never {
  if (error instanceof PackageNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Paket bulunamadı" });
  }
  if (error instanceof PackageAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu pakete erişiminiz yok" });
  }
  if (error instanceof DietitianProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diyetisyen profili bulunamadı" });
  }
  throw error;
}

export function createPackagesRouter(service: PackagesService) {
  return router({
    create: dietitianProcedure
      .input(CreatePackageInputSchema)
      .output(PackageSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.create(ctx.user.id, input);
        } catch (error) {
          mapPackageError(error);
        }
      }),

    update: dietitianProcedure
      .input(UpdatePackageInputSchema)
      .output(PackageSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.update(ctx.user.id, input);
        } catch (error) {
          mapPackageError(error);
        }
      }),

    list: dietitianProcedure.output(z.array(PackageSchema)).query(async ({ ctx }) => {
      try {
        return await service.listMine(ctx.user.id);
      } catch (error) {
        mapPackageError(error);
      }
    }),

    browse: publicProcedure
      .input(BrowsePackagesInputSchema)
      .output(BrowsePackagesResultSchema)
      .query(({ input }) => service.browse(input)),

    getById: publicProcedure
      .input(z.object({ id: z.string().uuid() }))
      .output(PackageWithDietitianSchema)
      .query(async ({ input }) => {
        try {
          return await service.getById(input.id);
        } catch (error) {
          mapPackageError(error);
        }
      }),
  });
}
