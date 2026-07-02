import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
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
    default:
      return notification.type;
  }
}

export default function NotificationsScreen() {
  const utils = trpc.useUtils();
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
    <FlatList<Notification>
      data={notifications}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>Bildirim yok.</Text>}
      renderItem={({ item }) => (
        <Pressable
          testID={`notification-${item.id}`}
          style={styles.row}
          onPress={() => !item.isRead && markAsReadMutation.mutate({ id: item.id })}
        >
          <Text style={item.isRead ? styles.rowTextRead : styles.rowTextUnread}>
            {describeNotification(item)}
          </Text>
        </Pressable>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Bildirimler</Text>
          {unreadCount > 0 && (
            <Pressable
              testID="mark-all-read-button"
              onPress={() => markAllAsReadMutation.mutate()}
              style={styles.markAllButton}
            >
              <Text style={styles.markAllButtonText}>Tümünü okundu işaretle ({unreadCount})</Text>
            </Pressable>
          )}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 22, fontWeight: "600" },
  markAllButton: { paddingVertical: 4 },
  markAllButtonText: { color: "#047857", fontSize: 13, fontWeight: "500" },
  emptyText: { color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 16 },
  row: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowTextRead: { fontSize: 14, color: "#9ca3af" },
  rowTextUnread: { fontSize: 14, color: "#111827", fontWeight: "500" },
});
