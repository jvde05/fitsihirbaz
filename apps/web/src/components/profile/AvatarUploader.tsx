"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export function resolveAvatarUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }
  return path.startsWith("http") ? path : `${API_URL}${path}`;
}

// Danışan/diyetisyen/admin profil sayfalarının ortak profil fotoğrafı bileşeni:
// fotoğraf seç → /uploads/image?kind=avatar'a yükle → users.updateProfile ile kaydet.
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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const accessToken = useAuthStore.getState().accessToken;
      const response = await fetch(`${API_URL}/uploads/image?kind=avatar`, {
        method: "POST",
        body: formData,
        credentials: "include",
        headers: accessToken ? { authorization: `Bearer ${accessToken}` } : undefined,
      });
      if (!response.ok) {
        throw new Error("Fotoğraf yüklenemedi");
      }
      const data = (await response.json()) as { url: string };
      await updateMutation.mutateAsync({ avatarUrl: data.url });
    } catch {
      setError("Fotoğraf yüklenemedi. Desteklenen türler: jpeg/png/webp/gif, maks 5MB.");
    } finally {
      setUploading(false);
    }
  }

  const resolvedUrl = resolveAvatarUrl(avatarUrl);

  return (
    <div className="flex items-center gap-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-full bg-gray-100">
        {resolvedUrl ? (
          <img src={resolvedUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">Foto Yok</div>
        )}
      </div>
      <div>
        <label className="cursor-pointer text-sm text-brand-700 hover:underline">
          {uploading ? "Yükleniyor..." : "Fotoğrafı Değiştir"}
          <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
        </label>
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
