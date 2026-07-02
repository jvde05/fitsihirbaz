import { Injectable, Logger } from "@nestjs/common";
import type { Prisma } from "@fit-sihirbaz/db";
import type { Notification } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { NotificationAccessDeniedError, NotificationNotFoundError } from "./notifications.errors";
import { toNotification } from "./notifications.mapper";

const LIST_LIMIT = 50;
const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

// Push bildirim başlığı/metni — bildirim tipi başına sabit bir Türkçe metin.
// Web/mobil bildirim çanı ekranlarındaki açıklama metinleriyle aynı fikirdedir.
function describePushNotification(type: string, payload: Record<string, unknown>): { title: string; body: string } {
  switch (type) {
    case "NEW_MESSAGE":
      return { title: "Yeni mesaj", body: String(payload.preview ?? "") };
    case "APPOINTMENT_REQUESTED":
      return { title: "Yeni randevu talebi", body: "Yeni bir randevu talebiniz var." };
    case "APPOINTMENT_STATUS_CHANGED":
      return { title: "Randevu güncellendi", body: `Randevu durumu: ${payload.status ?? ""}` };
    case "APPOINTMENT_REMINDER":
      return { title: "Randevu hatırlatma", body: "Randevunuza 1 saat kaldı." };
    case "ORDER_PAID":
      return { title: "Sipariş onaylandı", body: `Siparişiniz onaylandı: ${payload.packageTitle ?? ""}` };
    case "NEW_ORDER":
      return { title: "Yeni sipariş", body: `Yeni sipariş: ${payload.packageTitle ?? ""}` };
    case "DIETITIAN_VERIFIED":
      return { title: "Diyetisyen profili onaylandı", body: "Artık pazaryerinde görünüyorsunuz." };
    case "DIETITIAN_REJECTED":
      return { title: "Diyetisyen profili onaylanmadı", body: "Detaylar için bizimle iletişime geçin." };
    case "NEW_REVIEW":
      return { title: "Yeni yorum", body: `${payload.rating ?? ""} yıldızlı yeni bir yorum aldınız.` };
    default:
      return { title: "Fit Sihirbaz", body: "Yeni bir bildiriminiz var." };
  }
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Diğer servisler (messages, appointments, ...) yeni bir bildirim oluşturmak için bunu çağırır.
  async create(userId: string, type: string, payload: Prisma.InputJsonValue): Promise<void> {
    await this.prisma.notification.create({ data: { userId, type, payload } });
    await this.sendPushBestEffort(userId, type, payload);
  }

  // Push gönderimi best-effort'tur: token yoksa ya da Expo API hata dönerse bildirim
  // oluşturma akışını bozmaz, sadece loglar (MOBIL.md §5).
  private async sendPushBestEffort(userId: string, type: string, payload: Prisma.InputJsonValue): Promise<void> {
    try {
      const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { expoPushToken: true } });
      if (!user?.expoPushToken) {
        return;
      }
      const { title, body } = describePushNotification(type, (payload ?? {}) as Record<string, unknown>);
      const response = await fetch(EXPO_PUSH_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ to: user.expoPushToken, title, body, data: { type, ...(payload as object) } }),
      });
      if (!response.ok) {
        this.logger.warn(`Expo push gönderimi başarısız: ${response.status}`);
      }
    } catch (error) {
      this.logger.warn(`Expo push gönderimi sırasında hata: ${(error as Error).message}`);
    }
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
