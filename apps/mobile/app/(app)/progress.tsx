import { useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddProgressLogInputSchema, type AddProgressLogInput, type ProgressLog } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { WeightChart } from "@/components/WeightChart";

function ProgressRow({ log }: { log: ProgressLog }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowDate}>{log.logDate}</Text>
      <Text style={styles.rowValue}>{log.weightKg ?? "-"} kg</Text>
      <Text style={styles.rowValue}>Bel {log.waistCm ?? "-"}</Text>
      <Text style={styles.rowValue}>Kalça {log.hipCm ?? "-"}</Text>
    </View>
  );
}

export default function ProgressScreen() {
  const utils = trpc.useUtils();
  const logsQuery = trpc.progress.list.useQuery({});
  const [formError, setFormError] = useState<string | null>(null);

  const addLogMutation = trpc.progress.addLog.useMutation({
    onSuccess: () => {
      reset({ logDate: "", weightKg: undefined, waistCm: undefined, hipCm: undefined });
      setFormError(null);
      utils.progress.list.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddProgressLogInput>({
    resolver: zodResolver(AddProgressLogInputSchema),
    defaultValues: { logDate: "", weightKg: undefined, waistCm: undefined, hipCm: undefined },
  });

  async function onSubmit(values: AddProgressLogInput) {
    setFormError(null);
    await addLogMutation.mutateAsync(values);
  }

  const logs = [...(logsQuery.data ?? [])].reverse();
  const firstWeight = logsQuery.data?.[0]?.weightKg ?? null;
  const latestWeight = logsQuery.data?.[logsQuery.data.length - 1]?.weightKg ?? null;

  return (
    <FlatList
      data={logs}
      keyExtractor={(log) => log.id}
      renderItem={({ item }) => <ProgressRow log={item} />}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={<Text style={styles.emptyText}>Henüz ölçüm kaydı yok.</Text>}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>İlerleme</Text>

          {firstWeight !== null && latestWeight !== null && (
            <Text style={styles.summary}>
              İlk ölçüm: {firstWeight} kg → Son ölçüm: {latestWeight} kg ({(latestWeight - firstWeight).toFixed(1)}{" "}
              kg)
            </Text>
          )}

          <WeightChart logs={logsQuery.data ?? []} />

          <View style={styles.form}>
            <Text style={styles.label}>Tarih (YYYY-MM-DD)</Text>
            <Controller
              control={control}
              name="logDate"
              render={({ field }) => (
                <TextInput
                  testID="progress-logDate"
                  style={styles.input}
                  placeholder="2026-08-01"
                  value={field.value}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
            {errors.logDate && <Text style={styles.error}>{errors.logDate.message}</Text>}

            <Text style={styles.label}>Kilo (kg)</Text>
            <Controller
              control={control}
              name="weightKg"
              render={({ field }) => (
                <TextInput
                  testID="progress-weightKg"
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={field.value === undefined ? "" : String(field.value)}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Text style={styles.label}>Bel (cm)</Text>
            <Controller
              control={control}
              name="waistCm"
              render={({ field }) => (
                <TextInput
                  testID="progress-waistCm"
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={field.value === undefined ? "" : String(field.value)}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Text style={styles.label}>Kalça (cm)</Text>
            <Controller
              control={control}
              name="hipCm"
              render={({ field }) => (
                <TextInput
                  testID="progress-hipCm"
                  style={styles.input}
                  keyboardType="decimal-pad"
                  value={field.value === undefined ? "" : String(field.value)}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            {formError && <Text style={styles.error}>{formError}</Text>}

            <Pressable
              testID="progress-submit"
              style={[styles.button, isSubmitting && styles.buttonDisabled]}
              disabled={isSubmitting}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.buttonText}>{isSubmitting ? "Kaydediliyor..." : "Ölçüm Ekle"}</Text>
            </Pressable>
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Tarih</Text>
            <Text style={styles.tableHeaderText}>Kilo</Text>
            <Text style={styles.tableHeaderText}>Bel</Text>
            <Text style={styles.tableHeaderText}>Kalça</Text>
          </View>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 16 },
  header: { gap: 8, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: "600" },
  summary: { fontSize: 13, color: "#374151" },
  form: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12, gap: 4 },
  label: { fontSize: 13, fontWeight: "500", marginTop: 8 },
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
  tableHeader: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingBottom: 6 },
  tableHeaderText: { flex: 1, fontSize: 12, color: "#6b7280", fontWeight: "500" },
  row: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6" },
  rowDate: { flex: 1, fontSize: 13 },
  rowValue: { flex: 1, fontSize: 13, color: "#374151" },
  emptyText: { color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 16 },
});
