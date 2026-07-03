import { useState } from "react";
import { FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as ImagePicker from "expo-image-picker";
import { AddProgressLogInputSchema, type AddProgressLogInput, type ProgressLog } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { resolveMediaUrl, uploadImageAsset } from "@/lib/uploads";
import { WeightChart } from "@/components/WeightChart";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

const EMPTY_VALUES: AddProgressLogInput = {
  logDate: "",
  weightKg: undefined,
  bodyFatPercent: undefined,
  waistCm: undefined,
  hipCm: undefined,
  notes: undefined,
};

function ProgressRow({ log }: { log: ProgressLog }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowTop}>
        <Text style={styles.rowDate}>{log.logDate}</Text>
        <Text style={styles.rowValue}>{log.weightKg ?? "-"} kg</Text>
        <Text style={styles.rowValue}>Yağ {log.bodyFatPercent !== null ? `${log.bodyFatPercent}%` : "-"}</Text>
        <Text style={styles.rowValue}>Bel {log.waistCm ?? "-"}</Text>
        <Text style={styles.rowValue}>Kalça {log.hipCm ?? "-"}</Text>
      </View>
      {log.notes && <Text style={styles.rowNotes}>{log.notes}</Text>}
      {log.photoUrls.length > 0 && (
        <View style={styles.photoRow}>
          {log.photoUrls.map((url) => (
            <Image key={url} source={{ uri: resolveMediaUrl(url) }} style={styles.photoThumb} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function ProgressScreen() {
  const utils = trpc.useUtils();
  const logsQuery = trpc.progress.list.useQuery({});
  const [formError, setFormError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const addLogMutation = trpc.progress.addLog.useMutation({
    onSuccess: () => {
      reset(EMPTY_VALUES);
      setPhotoUrls([]);
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
    defaultValues: EMPTY_VALUES,
  });

  async function handlePickPhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setFormError("Fotoğraf seçmek için galeri izni gerekiyor");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    setUploadingPhoto(true);
    setFormError(null);
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const url = await uploadImageAsset(result.assets[0], accessToken, "progress");
      setPhotoUrls((current) => [...current, url].slice(0, 10));
    } catch {
      setFormError("Fotoğraf yüklenemedi");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSubmit(values: AddProgressLogInput) {
    setFormError(null);
    await addLogMutation.mutateAsync({ ...values, photoUrls });
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
      ListEmptyComponent={
        logsQuery.isError ? null : <Text style={styles.emptyText}>Henüz ölçüm kaydı yok.</Text>
      }
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>İlerleme</Text>
          <Text style={styles.subtitle}>
            Ölçümleriniz ve isterseniz ilerleme fotoğraflarınız otomatik olarak bağlı olduğunuz
            diyetisyeninizle paylaşılır.
          </Text>

          {logsQuery.isError && (
            <QueryErrorNotice message={logsQuery.error.message} onRetry={() => logsQuery.refetch()} />
          )}

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

            <Text style={styles.label}>Vücut Yağ Oranı (%)</Text>
            <Controller
              control={control}
              name="bodyFatPercent"
              render={({ field }) => (
                <TextInput
                  testID="progress-bodyFatPercent"
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

            <Text style={styles.label}>Notlar</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field }) => (
                <TextInput
                  testID="progress-notes"
                  style={[styles.input, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  value={field.value ?? ""}
                  onChangeText={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />

            <Text style={styles.label}>İlerleme Fotoğrafları (opsiyonel)</Text>
            <View style={styles.photoPickerRow}>
              {photoUrls.map((url) => (
                <View key={url} style={styles.photoWrap}>
                  <Image source={{ uri: resolveMediaUrl(url) }} style={styles.photoPreview} />
                  <Pressable
                    testID={`remove-progress-photo-${url}`}
                    style={styles.removePhotoButton}
                    onPress={() => setPhotoUrls((current) => current.filter((u) => u !== url))}
                  >
                    <Text style={styles.removePhotoButtonText}>×</Text>
                  </Pressable>
                </View>
              ))}
              <Pressable testID="pick-progress-photo" onPress={handlePickPhoto} disabled={uploadingPhoto}>
                <Text style={styles.pickPhotoText}>{uploadingPhoto ? "Yükleniyor..." : "Fotoğraf Ekle"}</Text>
              </Pressable>
            </View>

            {formError && <Text style={styles.error}>{formError}</Text>}

            <Pressable
              testID="progress-submit"
              style={[styles.button, (isSubmitting || uploadingPhoto) && styles.buttonDisabled]}
              disabled={isSubmitting || uploadingPhoto}
              onPress={handleSubmit(onSubmit)}
            >
              <Text style={styles.buttonText}>{isSubmitting ? "Kaydediliyor..." : "Ölçüm Ekle"}</Text>
            </Pressable>
          </View>

          <View style={styles.tableHeader}>
            <Text style={styles.tableHeaderText}>Tarih</Text>
            <Text style={styles.tableHeaderText}>Kilo</Text>
            <Text style={styles.tableHeaderText}>Yağ</Text>
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
  subtitle: { fontSize: 12, color: "#6b7280" },
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
  textArea: { minHeight: 60, textAlignVertical: "top" },
  error: { color: "#dc2626", fontSize: 12, marginTop: 4 },
  photoPickerRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 4 },
  photoWrap: { position: "relative" },
  photoPreview: { width: 56, height: 56, borderRadius: 8 },
  removePhotoButton: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: 999,
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  removePhotoButtonText: { color: "#fff", fontSize: 12, lineHeight: 14 },
  pickPhotoText: { color: "#047857", fontWeight: "500", fontSize: 13 },
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
  row: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#f3f4f6", gap: 4 },
  rowTop: { flexDirection: "row" },
  rowDate: { flex: 1, fontSize: 13 },
  rowValue: { flex: 1, fontSize: 13, color: "#374151" },
  rowNotes: { fontSize: 12, color: "#6b7280" },
  photoRow: { flexDirection: "row", gap: 6 },
  photoThumb: { width: 40, height: 40, borderRadius: 6 },
  emptyText: { color: "#9ca3af", fontSize: 13, textAlign: "center", marginTop: 16 },
});
