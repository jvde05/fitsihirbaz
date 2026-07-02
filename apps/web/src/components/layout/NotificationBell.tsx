"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md border border-gray-300 px-2.5 py-1.5 text-gray-700 hover:bg-gray-100"
        aria-label="Bildirimler"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-80 rounded-md border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-100 px-3 py-2">
            <span className="text-sm font-medium text-gray-700">Bildirimler</span>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => markAllAsReadMutation.mutate()}
                className="text-xs text-brand-700 hover:underline"
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
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                    notification.isRead ? "text-gray-400" : "font-medium text-gray-900"
                  }`}
                >
                  {describeNotification(notification)}
                </button>
              </li>
            ))}
            {notifications.length === 0 && (
              <li className="px-3 py-4 text-center text-sm text-gray-400">Bildirim yok.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
