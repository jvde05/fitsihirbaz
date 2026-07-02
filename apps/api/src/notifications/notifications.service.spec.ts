import { NotificationsService } from "./notifications.service";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationAccessDeniedError, NotificationNotFoundError } from "./notifications.errors";

function buildNotificationRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "notif-1",
    userId: "user-1",
    type: "NEW_MESSAGE",
    payload: { conversationId: "conv-1" },
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

describe("NotificationsService", () => {
  let prisma: {
    notification: { create: jest.Mock; findMany: jest.Mock; findUnique: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
  };
  let service: NotificationsService;

  beforeEach(() => {
    prisma = {
      notification: {
        create: jest.fn(),
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
    };
    service = new NotificationsService(prisma as unknown as PrismaService);
  });

  it("bildirim oluşturur", async () => {
    prisma.notification.create.mockResolvedValue(buildNotificationRow());
    await service.create("user-1", "NEW_MESSAGE", { conversationId: "conv-1" });
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: { userId: "user-1", type: "NEW_MESSAGE", payload: { conversationId: "conv-1" } },
    });
  });

  it("kullanıcının bildirimlerini listeler", async () => {
    prisma.notification.findMany.mockResolvedValue([buildNotificationRow()]);
    const result = await service.listForUser("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].type).toBe("NEW_MESSAGE");
  });

  describe("markAsRead", () => {
    it("bildirim yoksa NotificationNotFoundError fırlatır", async () => {
      prisma.notification.findUnique.mockResolvedValue(null);
      await expect(service.markAsRead("user-1", "yok")).rejects.toBeInstanceOf(NotificationNotFoundError);
    });

    it("başkasının bildirimini okundu işaretlemeye çalışırsa reddeder", async () => {
      prisma.notification.findUnique.mockResolvedValue(buildNotificationRow({ userId: "baska-user" }));
      await expect(service.markAsRead("user-1", "notif-1")).rejects.toBeInstanceOf(
        NotificationAccessDeniedError,
      );
    });

    it("kendi bildirimini okundu işaretler", async () => {
      prisma.notification.findUnique.mockResolvedValue(buildNotificationRow());
      prisma.notification.update.mockResolvedValue(buildNotificationRow({ isRead: true }));

      const result = await service.markAsRead("user-1", "notif-1");
      expect(result.isRead).toBe(true);
    });
  });
});
