import { Injectable } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type { Notification } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationAccessDeniedError, NotificationNotFoundError } from "./notifications.errors";
import { toNotification } from "./notifications.mapper";

const LIST_LIMIT = 50;

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  // Diğer servisler (messages, appointments, ...) yeni bir bildirim oluşturmak için bunu çağırır.
  async create(userId: string, type: string, payload: Prisma.InputJsonValue): Promise<void> {
    await this.prisma.notification.create({ data: { userId, type, payload } });
  }

  async listForUser(userId: string): Promise<Notification[]> {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: LIST_LIMIT,
    });
    return notifications.map(toNotification);
  }

  async markAsRead(userId: string, notificationId: string): Promise<Notification> {
    const existing = await this.prisma.notification.findUnique({ where: { id: notificationId } });
    if (!existing) {
      throw new NotificationNotFoundError();
    }
    if (existing.userId !== userId) {
      throw new NotificationAccessDeniedError();
    }
    const notification = await this.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
    return toNotification(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }
}
