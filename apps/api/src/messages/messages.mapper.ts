import type {
  ClientProfile,
  Conversation as ConversationRow,
  DietitianProfile,
  Message as MessageRow,
  User,
} from "@fit-sihirbaz/db";
import type { Conversation, Message, Role } from "@fit-sihirbaz/shared";

export function toMessage(row: MessageRow): Message {
  return {
    id: row.id,
    conversationId: row.conversationId,
    senderId: row.senderId,
    content: row.content,
    readAt: row.readAt ? row.readAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
  };
}

type ConversationWithParties = ConversationRow & {
  client: ClientProfile & { user: User };
  dietitian: DietitianProfile & { user: User };
};

export function toConversation(
  row: ConversationWithParties,
  viewerRole: Role,
  lastMessage: MessageRow | null,
  unreadCount: number,
): Conversation {
  const counterpartUser = viewerRole === "CLIENT" ? row.dietitian.user : row.client.user;
  return {
    id: row.id,
    clientId: row.clientId,
    dietitianId: row.dietitianId,
    counterpartFirstName: counterpartUser.firstName,
    counterpartLastName: counterpartUser.lastName,
    lastMessageContent: lastMessage?.content ?? null,
    lastMessageAt: lastMessage ? lastMessage.createdAt.toISOString() : null,
    unreadCount,
  };
}
