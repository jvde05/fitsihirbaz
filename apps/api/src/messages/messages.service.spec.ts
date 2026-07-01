import { MessagesService } from "./messages.service";
import { PrismaService } from "../prisma/prisma.service";
import {
  ClientNotLinkedError,
  ConversationAccessDeniedError,
  ConversationNotFoundError,
} from "./messages.errors";

function buildConversationRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "conv-1",
    clientId: "client-1",
    dietitianId: "dietitian-1",
    createdAt: new Date(),
    updatedAt: new Date(),
    client: { id: "client-1", userId: "client-user-1", user: { firstName: "Ali", lastName: "Veli" } },
    dietitian: { id: "dietitian-1", userId: "dyt-user-1", user: { firstName: "Ayşe", lastName: "Yılmaz" } },
    ...overrides,
  };
}

describe("MessagesService", () => {
  let prisma: {
    clientProfile: { findUnique: jest.Mock };
    dietitianProfile: { findUnique: jest.Mock };
    clientDietitianLink: { findFirst: jest.Mock };
    conversation: { findUnique: jest.Mock; create: jest.Mock; findMany: jest.Mock };
    message: { create: jest.Mock; findFirst: jest.Mock; count: jest.Mock; findMany: jest.Mock; updateMany: jest.Mock };
  };
  let service: MessagesService;

  beforeEach(() => {
    prisma = {
      clientProfile: { findUnique: jest.fn() },
      dietitianProfile: { findUnique: jest.fn() },
      clientDietitianLink: { findFirst: jest.fn() },
      conversation: { findUnique: jest.fn(), create: jest.fn(), findMany: jest.fn() },
      message: {
        create: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        findMany: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    service = new MessagesService(prisma as unknown as PrismaService);
  });

  describe("getOrCreateConversation", () => {
    it("bağlı olmayan taraf için ClientNotLinkedError fırlatır", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue(null);

      await expect(
        service.getOrCreateConversation("client-user-1", "CLIENT", "dietitian-1"),
      ).rejects.toBeInstanceOf(ClientNotLinkedError);
    });

    it("mevcut sohbeti varsa yeniden oluşturmaz", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue({ id: "link-1" });
      prisma.conversation.findUnique.mockResolvedValue(buildConversationRow());

      const result = await service.getOrCreateConversation("client-user-1", "CLIENT", "dietitian-1");
      expect(result.id).toBe("conv-1");
      expect(prisma.conversation.create).not.toHaveBeenCalled();
    });

    it("sohbet yoksa oluşturur", async () => {
      prisma.clientProfile.findUnique.mockResolvedValue({ id: "client-1" });
      prisma.clientDietitianLink.findFirst.mockResolvedValue({ id: "link-1" });
      prisma.conversation.findUnique.mockResolvedValue(null);
      prisma.conversation.create.mockResolvedValue(buildConversationRow());

      const result = await service.getOrCreateConversation("client-user-1", "CLIENT", "dietitian-1");
      expect(result.id).toBe("conv-1");
      expect(prisma.conversation.create).toHaveBeenCalledTimes(1);
    });
  });

  describe("send", () => {
    it("sohbet yoksa ConversationNotFoundError fırlatır", async () => {
      prisma.conversation.findUnique.mockResolvedValue(null);
      await expect(service.send("client-user-1", "yok", "merhaba")).rejects.toBeInstanceOf(
        ConversationNotFoundError,
      );
    });

    it("sohbetin tarafı olmayan kullanıcıyı reddeder", async () => {
      prisma.conversation.findUnique.mockResolvedValue(buildConversationRow());
      await expect(service.send("baska-user", "conv-1", "merhaba")).rejects.toBeInstanceOf(
        ConversationAccessDeniedError,
      );
    });

    it("mesajı gönderir", async () => {
      prisma.conversation.findUnique.mockResolvedValue(buildConversationRow());
      prisma.message.create.mockResolvedValue({
        id: "msg-1",
        conversationId: "conv-1",
        senderId: "client-user-1",
        content: "merhaba",
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.send("client-user-1", "conv-1", "merhaba");
      expect(result.content).toBe("merhaba");
    });
  });

  describe("listMessages", () => {
    it("okunmamış mesajları okundu olarak işaretler", async () => {
      prisma.conversation.findUnique.mockResolvedValue(buildConversationRow());
      prisma.message.findMany.mockResolvedValue([]);

      await service.listMessages("client-user-1", "conv-1");
      expect(prisma.message.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ conversationId: "conv-1", senderId: { not: "client-user-1" } }),
        }),
      );
    });
  });
});
