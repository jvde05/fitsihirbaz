import { Injectable } from "@nestjs/common";
import type { Conversation, Message, Role } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientNotLinkedError,
  ClientProfileNotFoundError,
  ConversationAccessDeniedError,
  ConversationNotFoundError,
  DietitianProfileNotFoundError,
} from "./messages.errors";
import { toConversation, toMessage } from "./messages.mapper";

const CONVERSATION_INCLUDE = {
  client: { include: { user: true } },
  dietitian: { include: { user: true } },
} as const;

@Injectable()
export class MessagesService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrCreateConversation(userId: string, role: Role, counterpartId: string): Promise<Conversation> {
    const { clientId, dietitianId } = await this.resolveParties(userId, role, counterpartId);

    let conversation = await this.prisma.conversation.findUnique({
      where: { clientId_dietitianId: { clientId, dietitianId } },
      include: CONVERSATION_INCLUDE,
    });

    if (!conversation) {
      conversation = await this.prisma.conversation.create({
        data: { clientId, dietitianId },
        include: CONVERSATION_INCLUDE,
      });
    }

    return toConversation(conversation, role, null, 0);
  }

  async send(userId: string, conversationId: string, content: string): Promise<Message> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { client: true, dietitian: true },
    });
    if (!conversation) {
      throw new ConversationNotFoundError();
    }
    await this.assertMembership(userId, conversation);

    const message = await this.prisma.message.create({
      data: { conversationId, senderId: userId, content },
    });
    return toMessage(message);
  }

  async listConversations(userId: string, role: Role): Promise<Conversation[]> {
    const where =
      role === "CLIENT"
        ? { clientId: (await this.getOwnClientProfile(userId)).id }
        : { dietitianId: (await this.getOwnDietitianProfile(userId)).id };

    const conversations = await this.prisma.conversation.findMany({
      where,
      include: CONVERSATION_INCLUDE,
      orderBy: { updatedAt: "desc" },
    });

    return Promise.all(
      conversations.map(async (conversation) => {
        const [lastMessage, unreadCount] = await Promise.all([
          this.prisma.message.findFirst({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: "desc" },
          }),
          this.prisma.message.count({
            where: { conversationId: conversation.id, senderId: { not: userId }, readAt: null },
          }),
        ]);
        return toConversation(conversation, role, lastMessage, unreadCount);
      }),
    );
  }

  async listMessages(userId: string, conversationId: string): Promise<Message[]> {
    const conversation = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { client: true, dietitian: true },
    });
    if (!conversation) {
      throw new ConversationNotFoundError();
    }
    await this.assertMembership(userId, conversation);

    await this.prisma.message.updateMany({
      where: { conversationId, senderId: { not: userId }, readAt: null },
      data: { readAt: new Date() },
    });

    const messages = await this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
    return messages.map(toMessage);
  }

  private async resolveParties(
    userId: string,
    role: Role,
    counterpartId: string,
  ): Promise<{ clientId: string; dietitianId: string }> {
    if (role === "CLIENT") {
      const clientProfile = await this.getOwnClientProfile(userId);
      const link = await this.prisma.clientDietitianLink.findFirst({
        where: { clientId: clientProfile.id, dietitianId: counterpartId, status: "ACTIVE" },
      });
      if (!link) {
        throw new ClientNotLinkedError();
      }
      return { clientId: clientProfile.id, dietitianId: counterpartId };
    }

    const dietitianProfile = await this.getOwnDietitianProfile(userId);
    const link = await this.prisma.clientDietitianLink.findFirst({
      where: { clientId: counterpartId, dietitianId: dietitianProfile.id, status: "ACTIVE" },
    });
    if (!link) {
      throw new ClientNotLinkedError();
    }
    return { clientId: counterpartId, dietitianId: dietitianProfile.id };
  }

  private async assertMembership(
    userId: string,
    conversation: { clientId: string; dietitianId: string; client: { userId: string }; dietitian: { userId: string } },
  ) {
    if (conversation.client.userId !== userId && conversation.dietitian.userId !== userId) {
      throw new ConversationAccessDeniedError();
    }
  }

  private async getOwnClientProfile(userId: string) {
    const profile = await this.prisma.clientProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new ClientProfileNotFoundError();
    }
    return profile;
  }

  private async getOwnDietitianProfile(userId: string) {
    const profile = await this.prisma.dietitianProfile.findUnique({ where: { userId } });
    if (!profile) {
      throw new DietitianProfileNotFoundError();
    }
    return profile;
  }
}
