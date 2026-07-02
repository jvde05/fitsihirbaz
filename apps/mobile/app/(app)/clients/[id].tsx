import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { trpc } from "@/lib/trpc";
import { WeightChart } from "@/components/WeightChart";

const PLAN_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Taslak",
  ACTIVE: "Aktif",
  COMPLETED: "Tamamlandı",
  ARCHIVED: "Arşivlendi",
};

export default function ClientDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const clientsQuery = trpc.dietitians.getMyClients.useQuery();
  const client = clientsQuery.data?.find((c) => c.id === id);

  const progressQuery = trpc.progress.list.useQuery({ clientId: id });
  const plansQuery = trpc.dietPlans.list.useQuery({ clientId: id });

  const logs = progressQuery.data ?? [];
  const firstWeight = logs.length > 0 ? logs[0].weightKg : null;
  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weightKg : null;

  if (clientsQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.name}>{client ? `${client.firstName} ${client.lastName}` : "Danışan"}</Text>
      {client && <Text style={styles.email}>{client.email}</Text>}

      <Text style={styles.sectionTitle}>Diyet Planları</Text>
      {plansQuery.data?.length === 0 && <Text style={styles.emptyText}>Henüz bir plan oluşturulmadı.</Text>}
      {plansQuery.data?.map((plan) => (
        <View key={plan.id} style={styles.planCard}>
          <Text style={styles.planTitle}>{plan.title}</Text>
          <View style={styles.planRow}>
            <Text style={styles.planMeta}>
              {plan.startDate}
              {plan.endDate ? ` – ${plan.endDate}` : ""} · Hedef: {plan.targetCalories ?? "-"} kcal
            </Text>
            <View style={styles.statusBadge}>
              <Text style={styles.statusBadgeText}>{PLAN_STATUS_LABELS[plan.status]}</Text>
            </View>
          </View>
        </View>
      ))}

      <Text style={styles.sectionTitle}>İlerleme</Text>
      {firstWeight !== null && latestWeight !== null && (
        <Text style={styles.summaryText}>
          İlk ölçüm: {firstWeight} kg → Son ölçüm: {latestWeight} kg ({(latestWeight - firstWeight).toFixed(1)} kg)
        </Text>
      )}
      {logs.length === 0 && <Text style={styles.emptyText}>Henüz ölçüm kaydı yok.</Text>}
      {logs.length > 0 && <WeightChart logs={logs} />}
      {logs.length > 0 &&
        [...logs]
          .reverse()
          .slice(0, 10)
          .map((log) => (
            <View key={log.id} style={styles.progressRow}>
              <Text style={styles.progressDate}>{log.logDate}</Text>
              <Text style={styles.progressValue}>{log.weightKg ?? "-"} kg</Text>
              <Text style={styles.progressValue}>Bel {log.waistCm ?? "-"}</Text>
              <Text style={styles.progressValue}>Kalça {log.hipCm ?? "-"}</Text>
            </View>
          ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 8 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  name: { fontSize: 22, fontWeight: "600" },
  email: { fontSize: 13, color: "#6b7280" },
  sectionTitle: { fontSize: 16, fontWeight: "600", marginTop: 20, marginBottom: 4 },
  emptyText: { color: "#9ca3af", fontSize: 13 },
  planCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, marginBottom: 8 },
  planTitle: { fontSize: 14, fontWeight: "600" },
  planRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  planMeta: { fontSize: 12, color: "#6b7280", flex: 1 },
  statusBadge: { backgroundColor: "#f3f4f6", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
  statusBadgeText: { fontSize: 11, color: "#374151" },
  summaryText: { fontSize: 13, color: "#374151", marginBottom: 8 },
  progressRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  progressDate: { fontSize: 12, color: "#111827" },
  progressValue: { fontSize: 12, color: "#6b7280" },
});
