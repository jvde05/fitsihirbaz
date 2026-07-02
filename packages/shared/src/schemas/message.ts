import { z } from "zod";

export const MessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderId: z.string().uuid(),
  content: z.string(),
  readAt: z.string().nullable(),
  createdAt: z.string(),
});
export type Message = z.infer<typeof MessageSchema>;

export const ConversationSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  dietitianId: z.string().uuid(),
  counterpartFirstName: z.string(),
  counterpartLastName: z.string(),
  lastMessageContent: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  unreadCount: z.number().int(),
});
export type Conversation = z.infer<typeof ConversationSchema>;

// counterpartId: CLIENT için dietitianId, DIETITIAN için clientId (karşı tarafın profil id'si).
export const GetOrCreateConversationInputSchema = z.object({
  counterpartId: z.string().uuid(),
});
export type GetOrCreateConversationInput = z.infer<typeof GetOrCreateConversationInputSchema>;

export const SendMessageInputSchema = z.object({
  conversationId: z.string().uuid(),
  content: z.string().min(1, "Mesaj boş olamaz").max(5000),
});
export type SendMessageInput = z.infer<typeof SendMessageInputSchema>;

export const ListMessagesInputSchema = z.object({
  conversationId: z.string().uuid(),
});
export type ListMessagesInput = z.infer<typeof ListMessagesInputSchema>;
