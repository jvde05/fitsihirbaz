import { Platform } from "react-native";
import type * as ImagePicker from "expo-image-picker";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000";

export function resolveMediaUrl(path: string): string {
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

// Akış paylaşımları, profil fotoğrafları ve ilerleme fotoğrafları için ortak yükleme
// yardımcı fonksiyonu. React Native'de FormData { uri, name, type } dosya nesnesi bekler;
// web'de gerçek bir Blob gerekir — bu yüzden platforma göre ayrım yapılır.
export async function uploadImageAsset(
  asset: ImagePicker.ImagePickerAsset,
  accessToken: string | null,
  kind: "post" | "avatar" | "progress" | "certification" = "post",
): Promise<string> {
  const filename = asset.fileName ?? `photo-${Date.now()}.jpg`;
  const mimeType = asset.mimeType ?? "image/jpeg";

  const formData = new FormData();
  if (Platform.OS === "web") {
    const blob = await (await fetch(asset.uri)).blob();
    formData.append("file", blob, filename);
  } else {
    formData.append("file", { uri: asset.uri, name: filename, type: mimeType } as unknown as Blob);
  }

  const response = await fetch(`${API_URL}/uploads/image?kind=${kind}`, {
    method: "POST",
    body: formData,
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!response.ok) {
    throw new Error("Fotoğraf yüklenemedi");
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}
