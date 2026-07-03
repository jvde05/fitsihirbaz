import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { resolveMediaUrl, uploadImageAsset } from "@/lib/uploads";

// Danışan/diyetisyen profil ekranlarının ortak profil fotoğrafı bileşeni.
export function AvatarUploader({ avatarUrl, onUpdated }: { avatarUrl: string | null; onUpdated: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateMutation = trpc.users.updateProfile.useMutation({
    onSuccess: (user) => {
      setError(null);
      useAuthStore.setState((state) => (state.user ? { user: { ...state.user, avatarUrl: user.avatarUrl } } : {}));
      onUpdated();
    },
    onError: (err) => setError(err.message),
  });

  async function handlePickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Fotoğraf seçmek için galeri izni gerekiyor");
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
      const url = await uploadImageAsset(result.assets[0], accessToken, "avatar");
      await updateMutation.mutateAsync({ avatarUrl: url });
    } catch {
      setError("Fotoğraf yüklenemedi");
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        {avatarUrl ? (
          <Image source={{ uri: resolveMediaUrl(avatarUrl) }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarPlaceholder}>Foto Yok</Text>
        )}
      </View>
      <View style={styles.actions}>
        <Pressable testID="change-avatar-button" onPress={handlePickImage} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" />
          ) : (
            <Text style={styles.changeText}>Fotoğrafı Değiştir</Text>
          )}
        </Pressable>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  avatarImage: { width: "100%", height: "100%" },
  avatarPlaceholder: { fontSize: 10, color: "#9ca3af" },
  actions: { gap: 4 },
  changeText: { color: "#047857", fontWeight: "500", fontSize: 13 },
  errorText: { color: "#dc2626", fontSize: 12 },
});
