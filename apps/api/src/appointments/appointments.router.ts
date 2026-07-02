import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  AppointmentSchema,
  CancelAppointmentInputSchema,
  CreateAppointmentInputSchema,
  UpdateAppointmentStatusInputSchema,
} from "@fit-sihirbaz/shared";
import { clientProcedure, dietitianProcedure, protectedProcedure, router } from "../trpc/trpc";
import type { AppointmentsService } from "./appointments.service";
import {
  AppointmentAccessDeniedError,
  AppointmentNotFoundError,
  ClientNotLinkedError,
  ClientProfileNotFoundError,
  DietitianProfileNotFoundError,
} from "./appointments.errors";

function mapAppointmentError(error: unknown): never {
  if (error instanceof AppointmentNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Randevu bulunamadı" });
  }
  if (error instanceof AppointmentAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu randevuya erişiminiz yok" });
  }
  if (error instanceof ClientNotLinkedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu diyetisyenin danışanı değilsiniz" });
  }
  if (error instanceof ClientProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Danışan profili bulunamadı" });
  }
  if (error instanceof DietitianProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diyetisyen profili bulunamadı" });
  }
  throw error;
}

export function createAppointmentsRouter(service: AppointmentsService) {
  return router({
    create: clientProcedure
      .input(CreateAppointmentInputSchema)
      .output(AppointmentSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.create(ctx.user.id, input);
        } catch (error) {
          mapAppointmentError(error);
        }
      }),

    updateStatus: dietitianProcedure
      .input(UpdateAppointmentStatusInputSchema)
      .output(AppointmentSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.updateStatus(ctx.user.id, input);
        } catch (error) {
          mapAppointmentError(error);
        }
      }),

    cancel: protectedProcedure
      .input(CancelAppointmentInputSchema)
      .output(AppointmentSchema)
      .mutation(async ({ ctx, input }) => {
        if (ctx.user.role !== "CLIENT" && ctx.user.role !== "DIETITIAN") {
          throw new TRPCError({ code: "FORBIDDEN", message: "Bu işlem için yetkiniz yok" });
        }
        try {
          return await service.cancel(ctx.user.id, ctx.user.role, input.id);
        } catch (error) {
          mapAppointmentError(error);
        }
      }),

    listForClient: clientProcedure.output(z.array(AppointmentSchema)).query(async ({ ctx }) => {
      try {
        return await service.listForClient(ctx.user.id);
      } catch (error) {
        mapAppointmentError(error);
      }
    }),

    listForDietitian: dietitianProcedure.output(z.array(AppointmentSchema)).query(async ({ ctx }) => {
      try {
        return await service.listForDietitian(ctx.user.id);
      } catch (error) {
        mapAppointmentError(error);
      }
    }),
  });
}
