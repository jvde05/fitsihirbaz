"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { resolveMediaUrl } from "@/lib/media";
import { uploadImage } from "@/lib/uploads";

// Diyetisyenin lisans/diploma/sertifika belgelerini fotoğraf olarak yükleyip admin
// doğrulama kuyruğunda görünmesini sağlayan bileşen (bkz. DietitianProfile.certificationUrls).
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

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const url = await uploadImage(file, "certification");
      await addMutation.mutateAsync({ url });
    } catch {
      setError("Belge yüklenemedi. Desteklenen türler: jpeg/png/webp/gif, maks 5MB.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">Sertifika / Lisans Belgeleri</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        Diploma, uzmanlık belgesi veya lisans fotoğrafı yükleyin — admin doğrulaması sırasında incelenir.
      </p>

      {certificationUrls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {certificationUrls.map((url) => (
            <div key={url} className="relative h-20 w-20 overflow-hidden rounded-md border">
              <img src={resolveMediaUrl(url) ?? undefined} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeMutation.mutate({ url })}
                disabled={removeMutation.isLoading}
                className="absolute right-0 top-0 rounded-bl-md bg-black/60 p-1 text-white hover:bg-black/80"
                aria-label="Belgeyi kaldır"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <label className="mt-3 inline-block cursor-pointer text-sm text-primary hover:underline">
        {uploading ? "Yükleniyor..." : "+ Belge Ekle"}
        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={uploading} />
      </label>
      {error && <p className="mt-1 text-sm text-destructive">{error}</p>}
    </div>
  );
}
