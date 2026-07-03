import { FlatList, StyleSheet, Text, View } from "react-native";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import type { Order } from "@fit-sihirbaz/shared";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  PAID: "Ödendi",
  CANCELLED: "İptal Edildi",
  REFUNDED: "İade Edildi",
};

export default function OrdersScreen() {
  const ordersQuery = trpc.orders.listForDietitian.useQuery();
  const orders = ordersQuery.data ?? [];
  const totalEarnings = orders
    .filter((order) => order.status === "PAID")
    .reduce((sum, order) => sum + order.dietitianPayoutAmount, 0);

  return (
    <FlatList<Order>
      data={orders}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={
        !ordersQuery.isLoading && !ordersQuery.isError ? (
          <Text style={styles.emptyText}>Henüz siparişiniz yok.</Text>
        ) : null
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Siparişlerim</Text>
          {ordersQuery.isError && (
            <QueryErrorNotice message={ordersQuery.error.message} onRetry={() => ordersQuery.refetch()} />
          )}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Toplam Kazanç (Ödenen Siparişler)</Text>
            <Text style={styles.summaryValue}>{totalEarnings.toFixed(2)} TRY</Text>
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>{item.packageTitle}</Text>
            <Text style={styles.rowMeta}>
              {item.counterpartFirstName} {item.counterpartLastName} ·{" "}
              {new Date(item.createdAt).toLocaleDateString("tr-TR")}
            </Text>
          </View>
          <View style={styles.rowAmount}>
            <Text style={styles.amountText}>
              {item.dietitianPayoutAmount} {item.currency}
            </Text>
            <Text style={styles.statusText}>{STATUS_LABELS[item.status]}</Text>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  header: { gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "600" },
  summaryCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 14 },
  summaryLabel: { fontSize: 11, fontWeight: "600", color: "#6b7280", textTransform: "uppercase" },
  summaryValue: { fontSize: 20, fontWeight: "600", marginTop: 4 },
  emptyText: { color: "#9ca3af", fontSize: 13 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowInfo: { flex: 1 },
  rowName: { fontSize: 14, fontWeight: "500" },
  rowMeta: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  rowAmount: { alignItems: "flex-end" },
  amountText: { fontSize: 14, fontWeight: "600" },
  statusText: { fontSize: 12, color: "#6b7280", marginTop: 2 },
});
