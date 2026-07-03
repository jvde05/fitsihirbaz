import { useAuthStore } from "./auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// Akış paylaşımları, profil fotoğrafları ve ilerleme fotoğrafları için ortak yükleme
// yardımcı fonksiyonu. Gerçek S3/R2 kimlik bilgileri henüz yok; dosya yerel diske yazılıp
// relatif bir yolla (/uploads/...) dönüyor (bkz. apps/api/src/uploads).
export async function uploadImage(file: File, kind: "post" | "avatar" | "progress" = "post"): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const accessToken = useAuthStore.getState().accessToken;
  const response = await fetch(`${API_URL}/uploads/image?kind=${kind}`, {
    method: "POST",
    body: formData,
    credentials: "include",
    headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
  });
  if (!response.ok) {
    throw new Error("Fotoğraf yüklenemedi");
  }
  const data = (await response.json()) as { url: string };
  return data.url;
}
