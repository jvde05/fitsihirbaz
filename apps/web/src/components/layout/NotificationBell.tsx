"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Notification } from "@fit-sihirbaz/shared";

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

export function NotificationBell() {
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
                  onClick={() => !notification.isRead && markAsReadMutation.mutate({ id: notification.id })}
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
