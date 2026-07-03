import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { resolveMediaUrl, uploadImageAsset } from "@/lib/uploads";

// Diyetisyenin lisans/diploma/sertifika belgelerini fotoğraf olarak yükleyip admin
// doğrulama kuyruğunda görünmesini sağlayan bileşen (web CertificationUploader ile parite).
export function CertificationUploader({
  certificationUrls,
  onUpdated,
}: {
  certificationUrls: string[];
  onUpdated: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addMutation = trpc.dietitians.addCertification.useMutation({
    onSuccess: () => {
      setError(null);
      onUpdated();
    },
    onError: (err) => setError(err.message),
  });
  const removeMutation = trpc.dietitians.removeCertification.useMutation({
    onSuccess: () => onUpdated(),
  });

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Belge seçmek için galeri izni gerekiyor");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || !result.assets[0]) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const accessToken = useAuthStore.getState().accessToken;
      const url = await uploadImageAsset(result.assets[0], accessToken, "certification");
      await addMutation.mutateAsync({ url });
    } catch {
      setError("Belge yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View>
      <Text style={styles.title}>Sertifika / Lisans Belgeleri</Text>
      <Text style={styles.subtitle}>
        Diploma, uzmanlık belgesi veya lisans fotoğrafı yükleyin — admin doğrulaması sırasında incelenir.
      </Text>

      {certificationUrls.length > 0 && (
        <View style={styles.thumbRow}>
          {certificationUrls.map((url) => (
            <View key={url} style={styles.thumbWrap}>
              <Image source={{ uri: resolveMediaUrl(url) }} style={styles.thumb} />
              <Pressable
                testID={`remove-certification-${url}`}
                style={styles.removeButton}
                onPress={() => removeMutation.mutate({ url })}
                disabled={removeMutation.isLoading}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}

      <Pressable testID="add-certification-button" style={styles.addButton} onPress={handlePickImage} disabled={uploading}>
        {uploading ? <ActivityIndicator size="small" /> : <Text style={styles.addButtonText}>+ Belge Ekle</Text>}
      </Pressable>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontSize: 13, fontWeight: "600", color: "#374151" },
  subtitle: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  thumbRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  thumbWrap: { width: 64, height: 64, borderRadius: 6, overflow: "hidden", position: "relative" },
  thumb: { width: "100%", height: "100%" },
  removeButton: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderBottomLeftRadius: 6,
  },
  removeButtonText: { color: "#fff", fontSize: 10 },
  addButton: { marginTop: 10, alignSelf: "flex-start" },
  addButtonText: { color: "#047857", fontWeight: "500", fontSize: 13 },
  errorText: { color: "#dc2626", fontSize: 12, marginTop: 4 },
});
