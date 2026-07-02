import type { Notification as NotificationRow } from "@fit-sihirbaz/db";
import type { Notification } from "@fit-sihirbaz/shared";

export function toNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    type: row.type,
    payload: (row.payload as Record<string, unknown>) ?? {},
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}
