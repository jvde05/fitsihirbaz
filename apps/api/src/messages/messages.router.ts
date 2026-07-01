import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  ConversationSchema,
  GetOrCreateConversationInputSchema,
  ListMessagesInputSchema,
  MessageSchema,
  SendMessageInputSchema,
} from "@fit-sihirbaz/shared";
import { protectedProcedure, router } from "../trpc/trpc";
import type { MessagesService } from "./messages.service";
import {
  ClientNotLinkedError,
  ClientProfileNotFoundError,
  ConversationAccessDeniedError,
  ConversationNotFoundError,
  DietitianProfileNotFoundError,
} from "./messages.errors";

function mapMessagesError(error: unknown): never {
  if (error instanceof ConversationNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Sohbet bulunamadı" });
  }
  if (error instanceof ConversationAccessDeniedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu sohbete erişiminiz yok" });
  }
  if (error instanceof ClientNotLinkedError) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Bu kişiyle bağlantınız yok" });
  }
  if (error instanceof ClientProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Danışan profili bulunamadı" });
  }
  if (error instanceof DietitianProfileNotFoundError) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Diyetisyen profili bulunamadı" });
  }
  throw error;
}

export function createMessagesRouter(service: MessagesService) {
  return router({
    getOrCreateConversation: protectedProcedure
      .input(GetOrCreateConversationInputSchema)
      .output(ConversationSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.getOrCreateConversation(ctx.user.id, ctx.user.role, input.counterpartId);
        } catch (error) {
          mapMessagesError(error);
        }
      }),

    send: protectedProcedure
      .input(SendMessageInputSchema)
      .output(MessageSchema)
      .mutation(async ({ ctx, input }) => {
        try {
          return await service.send(ctx.user.id, input.conversationId, input.content);
        } catch (error) {
          mapMessagesError(error);
        }
      }),

    listConversations: protectedProcedure.output(z.array(ConversationSchema)).query(async ({ ctx }) => {
      try {
        return await service.listConversations(ctx.user.id, ctx.user.role);
      } catch (error) {
        mapMessagesError(error);
      }
    }),

    listMessages: protectedProcedure
      .input(ListMessagesInputSchema)
      .output(z.array(MessageSchema))
      .query(async ({ ctx, input }) => {
        try {
          return await service.listMessages(ctx.user.id, input.conversationId);
        } catch (error) {
          mapMessagesError(error);
        }
      }),
  });
}
