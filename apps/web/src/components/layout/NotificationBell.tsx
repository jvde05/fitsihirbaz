"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification, Role } from "@fit-sihirbaz/shared";

const POLL_INTERVAL_MS = 10000;

function describeNotification(notification: Notification): string {
  switch (notification.type) {
    case "NEW_MESSAGE":
      return `Yeni mesaj: ${notification.payload.preview ?? ""}`;
    case "APPOINTMENT_REQUESTED":
      return "Yeni bir randevu talebi aldınız.";
    case "APPOINTMENT_STATUS_CHANGED":
      return `Randevu durumu güncellendi: ${notification.payload.status ?? ""}`;
    case "APPOINTMENT_REMINDER":
      return "Randevunuza 1 saat kaldı.";
    case "ORDER_PAID":
      return `Siparişiniz onaylandı: ${notification.payload.packageTitle ?? ""}`;
    case "NEW_ORDER":
      return `Yeni sipariş: ${notification.payload.packageTitle ?? ""} (${notification.payload.amount ?? ""} TRY)`;
    case "DIETITIAN_VERIFIED":
      return "Diyetisyen profiliniz onaylandı! Artık pazaryerinde görünüyorsunuz.";
    case "DIETITIAN_REJECTED":
      return "Diyetisyen profiliniz onaylanmadı. Detaylar için bizimle iletişime geçin.";
    case "NEW_REVIEW":
      return `Yeni bir yorum aldınız: ${notification.payload.rating ?? ""} yıldız`;
    default:
      return notification.type;
  }
}

// Bildirime tıklayınca gidilecek sayfa — rol bazlı (diyetisyen/danışan aynı bildirim
// tipi için farklı rotalara sahip). Henüz tek tek randevu/sipariş/konuşma detayına
// derin bağlantı (deep link) yok, ilgili listeleme sayfasına götürülüyor.
function getNotificationLink(notification: Notification, role: Role | undefined): string | null {
  switch (notification.type) {
    case "NEW_MESSAGE":
      return role === "DIETITIAN" ? "/diyetisyen/mesajlar" : "/danisan/mesajlar";
    case "APPOINTMENT_REQUESTED":
    case "APPOINTMENT_STATUS_CHANGED":
    case "APPOINTMENT_REMINDER":
      return role === "DIETITIAN" ? "/diyetisyen/randevular" : "/danisan/randevular";
    case "ORDER_PAID":
      return "/danisan/panel";
    case "NEW_ORDER":
      return "/diyetisyen/siparisler";
    case "DIETITIAN_VERIFIED":
    case "DIETITIAN_REJECTED":
    case "NEW_REVIEW":
      return "/diyetisyen/profil";
    default:
      return null;
  }
}

export function NotificationBell() {
  const router = useRouter();
  const role = useAuthStore((s) => s.user?.role);
  const utils = trpc.useUtils();
  const [open, setOpen] = useState(false);
  const notificationsQuery = trpc.notifications.list.useQuery(undefined, {
    refetchInterval: POLL_INTERVAL_MS,
  });

  const markAsReadMutation = trpc.notifications.markAsRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });
  const markAllAsReadMutation = trpc.notifications.markAllAsRead.useMutation({
    onSuccess: () => utils.notifications.list.invalidate(),
  });

  function handleNotificationClick(notification: Notification) {
    if (!notification.isRead) {
      markAsReadMutation.mutate({ id: notification.id });
    }
    setOpen(false);
    const link = getNotificationLink(notification, role);
    if (link) {
      router.push(link);
    }
  }

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="icon"
        className="relative h-8 w-8"
        onClick={() => setOpen((v) => !v)}
        aria-label="Bildirimler"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-none text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-md border bg-popover text-popover-foreground shadow-lg">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">Bildirimler</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-primary hover:underline"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => (
              <li key={notification.id}>
                <button
                  type="button"
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "block w-full px-3 py-2 text-left text-sm hover:bg-muted",
                    notification.isRead ? "text-muted-foreground" : "font-medium",
                  )}
                >
                  {describeNotification(notification)}
                </button>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-muted-foreground">Bildirim yok.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
