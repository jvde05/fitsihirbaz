import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { MarkNotificationReadInputSchema, NotificationSchema } from "@fit-sihirbaz/shared";
import { protectedProcedure, router } from "../trpc/trpc";
import type { NotificationsService } from "./notifications.service";
import { NotificationAccessDeniedError, NotificationNotFoundError } from "./notifications.errors";

export function createNotificationsRouter(service: NotificationsService) {
  return router({
    list: protectedProcedure.output(z.array(NotificationSchema)).query(({ ctx }) =>
      service.listForUser(ctx.user.id),
    ),

    markAsRead: protectedProcedure
      .input(MarkNotificationReadInputSchema)
      .output(NotificationSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.markAsRead(ctx.user.id, input.id);
        } catch (error) {
          if (error instanceof NotificationNotFoundError) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Bildirim bulunamadı" });
          }
          if (error instanceof NotificationAccessDeniedError) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Bu bildirime erişiminiz yok" });
          }
          throw error;
        }
      }),

    markAllAsRead: protectedProcedure.output(z.object({ success: z.literal(true) })).mutation(async ({ ctx }) => {
      await service.markAllAsRead(ctx.user.id);
      return { success: true };
    }),
  });
}
