import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import type { Appointment, AppointmentStatus } from "@fit-sihirbaz/shared";

const STATUS_LABELS: Record<string, string> = {
  SCHEDULED: "Planlandı",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal Edildi",
  NO_SHOW: "Gelinmedi",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("tr-TR");
}

function DietitianAppointmentsScreen() {
  const utils = trpc.useUtils();
  const appointmentsQuery = trpc.appointments.listForDietitian.useQuery();

  const updateStatusMutation = trpc.appointments.updateStatus.useMutation({
    onSuccess: () => utils.appointments.listForDietitian.invalidate(),
  });

  return (
    <FlatList<Appointment>
      data={appointmentsQuery.data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>Henüz randevunuz yok.</Text>}
      ListHeaderComponent={<Text style={styles.title}>Randevu Takvimi</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>
              {item.counterpartFirstName} {item.counterpartLastName}
            </Text>
            <Text style={styles.rowMeta}>
              {formatDateTime(item.scheduledAt)} · {STATUS_LABELS[item.status]}
            </Text>
          </View>
          {item.status === "SCHEDULED" && (
            <View style={styles.statusButtonRow}>
              {(["COMPLETED", "CANCELLED", "NO_SHOW"] as AppointmentStatus[]).map((status) => (
                <Pressable
                  key={status}
                  testID={`set-status-${status}-${item.id}`}
                  style={styles.statusButton}
                  onPress={() => updateStatusMutation.mutate({ id: item.id, status })}
                >
                  <Text style={styles.statusButtonText}>{STATUS_LABELS[status]}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}
    />
  );
}

function ClientAppointmentsScreen() {
  const utils = trpc.useUtils();
  const appointmentsQuery = trpc.appointments.listForClient.useQuery();
  const dietitiansQuery = trpc.clients.getMyDietitians.useQuery();
  const [dietitianId, setDietitianId] = useState<string | null>(null);
  const [scheduledAt, setScheduledAt] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = trpc.appointments.create.useMutation({
    onSuccess: () => {
      setFormError(null);
      setScheduledAt("");
      utils.appointments.listForClient.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const cancelMutation = trpc.appointments.cancel.useMutation({
    onSuccess: () => utils.appointments.listForClient.invalidate(),
  });

  function handleSubmit() {
    if (!dietitianId) {
      setFormError("Bir diyetisyen seçin");
      return;
    }
    setFormError(null);
    createMutation.mutate({ dietitianId, scheduledAt });
  }

  const dietitians = dietitiansQuery.data ?? [];

  return (
    <FlatList<Appointment>
      data={appointmentsQuery.data ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>Henüz randevunuz yok.</Text>}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.rowInfo}>
            <Text style={styles.rowName}>
              {item.counterpartFirstName} {item.counterpartLastName}
            </Text>
            <Text style={styles.rowMeta}>
              {formatDateTime(item.scheduledAt)} · {STATUS_LABELS[item.status]}
            </Text>
          </View>
          {item.status === "SCHEDULED" && (
            <Pressable
              testID={`cancel-appointment-${item.id}`}
              style={styles.cancelButton}
              onPress={() => cancelMutation.mutate({ id: item.id })}
            >
              <Text style={styles.cancelButtonText}>İptal Et</Text>
            </Pressable>
          )}
        </View>
      )}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Randevularım</Text>

          {dietitians.length === 0 ? (
            <Text style={styles.emptyText}>
              Randevu talep edebilmek için önce bir diyetisyene bağlı olmalısınız.
            </Text>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Diyetisyen</Text>
              <View style={styles.dietitianList}>
                {dietitians.map((dietitian) => (
                  <Pressable
                    key={dietitian.id}
                    testID={`select-dietitian-${dietitian.id}`}
                    style={[styles.dietitianChip, dietitianId === dietitian.id && styles.dietitianChipSelected]}
                    onPress={() => setDietitianId(dietitian.id)}
                  >
                    <Text
                      style={dietitianId === dietitian.id ? styles.dietitianChipTextSelected : styles.dietitianChipText}
                    >
                      {dietitian.firstName} {dietitian.lastName}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={styles.label}>Tarih/Saat (YYYY-MM-DDTHH:mm)</Text>
              <TextInput
                testID="appointment-scheduledAt"
                style={styles.input}
                placeholder="2026-08-10T09:00"
                value={scheduledAt}
                onChangeText={setScheduledAt}
              />

              {formError && <Text style={styles.error}>{formError}</Text>}

              <Pressable
                testID="create-appointment-submit"
                style={[styles.button, createMutation.isLoading && styles.buttonDisabled]}
                disabled={createMutation.isLoading}
                onPress={handleSubmit}
              >
                <Text style={styles.buttonText}>
                  {createMutation.isLoading ? "Talep ediliyor..." : "Randevu Talep Et"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      }
    />
  );
}

export default function AppointmentsScreen() {
  const isDietitian = useAuthStore((s) => s.user?.role) === "DIETITIAN";
  return isDietitian ? <DietitianAppointmentsScreen /> : <ClientAppointmentsScreen />;
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  header: { gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "600", marginBottom: 8 },
  form: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, gap: 4 },
  label: { fontSize: 13, fontWeight: "500", marginTop: 8 },
  dietitianList: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  dietitianChip: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  dietitianChipSelected: { backgroundColor: "#059669", borderColor: "#059669" },
  dietitianChipText: { color: "#374151", fontSize: 13 },
  dietitianChipTextSelected: { color: "#fff", fontSize: 13, fontWeight: "600" },
  input: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  error: { color: "#dc2626", fontSize: 12, marginTop: 4 },
  button: {
    marginTop: 16,
    backgroundColor: "#059669",
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "#fff", fontWeight: "600" },
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
  cancelButton: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  cancelButtonText: { fontSize: 12, color: "#374151", fontWeight: "500" },
  statusButtonRow: { flexDirection: "row", gap: 6 },
  statusButton: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6 },
  statusButtonText: { fontSize: 11, color: "#374151", fontWeight: "500" },
});
