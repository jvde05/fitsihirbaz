"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddProgressLogInputSchema, type AddProgressLogInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { WeightChart } from "@/components/WeightChart";
import { resolveMediaUrl } from "@/lib/media";
import { uploadImage } from "@/lib/uploads";

export default function IlerlemePage() {
  const utils = trpc.useUtils();
  const logsQuery = trpc.progress.list.useQuery({});
  const [formError, setFormError] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const addLogMutation = trpc.progress.addLog.useMutation({
    onSuccess: () => {
      reset();
      setPhotoUrls([]);
      setFormError(null);
      utils.progress.list.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddProgressLogInput>({ resolver: zodResolver(AddProgressLogInputSchema) });

  async function handlePhotoChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) {
      return;
    }
    setUploadingPhoto(true);
    setFormError(null);
    try {
      const uploaded = await Promise.all(files.map((file) => uploadImage(file, "progress")));
      setPhotoUrls((current) => [...current, ...uploaded].slice(0, 10));
    } catch {
      setFormError("Fotoğraf yüklenemedi. Desteklenen türler: jpeg/png/webp/gif, maks 5MB.");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function onSubmit(values: AddProgressLogInput) {
    setFormError(null);
    await addLogMutation.mutateAsync({ ...values, photoUrls });
  }

  const logs = logsQuery.data ?? [];
  const latestWeight = logs.length > 0 ? logs[logs.length - 1].weightKg : null;
  const firstWeight = logs.length > 0 ? logs[0].weightKg : null;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">İlerleme</h1>
      <p className="mb-6 max-w-2xl text-sm text-gray-500">
        Ölçümlerinizi ve isterseniz ilerleme fotoğraflarınızı buradan kaydedin. Kaydettiğiniz veriler
        otomatik olarak bağlı olduğunuz diyetisyeninizle paylaşılır.
      </p>

      {firstWeight !== null && latestWeight !== null && (
        <div className="mb-6 rounded-md border border-gray-200 bg-white p-4 text-sm text-gray-700">
          İlk ölçüm: {firstWeight} kg → Son ölçüm: {latestWeight} kg (
          {(latestWeight - firstWeight).toFixed(1)} kg)
        </div>
      )}

      <div className="mb-6">
        <WeightChart logs={logs} />
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-8 flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="logDate">
              Tarih
            </label>
            <input
              id="logDate"
              type="date"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
              {...register("logDate")}
            />
            {errors.logDate && <p className="mt-1 text-xs text-red-600">{errors.logDate.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="weightKg">
              Kilo (kg)
            </label>
            <input
              id="weightKg"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
              {...register("weightKg")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="bodyFatPercent">
              Vücut Yağ Oranı (%)
            </label>
            <input
              id="bodyFatPercent"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
              {...register("bodyFatPercent")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="waistCm">
              Bel (cm)
            </label>
            <input
              id="waistCm"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
              {...register("waistCm")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="hipCm">
              Kalça (cm)
            </label>
            <input
              id="hipCm"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-2 py-1.5"
              {...register("hipCm")}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="notes">
            Notlar
          </label>
          <textarea
            id="notes"
            rows={2}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("notes")}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">İlerleme Fotoğrafları (opsiyonel)</label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {photoUrls.map((url) => (
              <div key={url} className="relative">
                <img src={resolveMediaUrl(url) ?? undefined} alt="" className="h-16 w-16 rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrls((current) => current.filter((u) => u !== url))}
                  className="absolute -right-1 -top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-xs text-white hover:bg-black/80"
                >
                  ×
                </button>
              </div>
            ))}
            <label className="cursor-pointer text-sm text-brand-700 hover:underline">
              {uploadingPhoto ? "Yükleniyor..." : "Fotoğraf Ekle"}
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handlePhotoChange}
                disabled={uploadingPhoto}
              />
            </label>
          </div>
        </div>

        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting || uploadingPhoto}
          className="self-start rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Kaydediliyor..." : "Ölçüm Ekle"}
        </button>
      </form>

      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500">
            <th className="py-2">Tarih</th>
            <th className="py-2">Kilo</th>
            <th className="py-2">Yağ Oranı</th>
            <th className="py-2">Bel</th>
            <th className="py-2">Kalça</th>
            <th className="py-2">Fotoğraflar</th>
          </tr>
        </thead>
        <tbody>
          {[...logs].reverse().map((log) => (
            <tr key={log.id} className="border-b border-gray-100">
              <td className="py-2">{log.logDate}</td>
              <td className="py-2">{log.weightKg ?? "-"}</td>
              <td className="py-2">{log.bodyFatPercent !== null ? `${log.bodyFatPercent}%` : "-"}</td>
              <td className="py-2">{log.waistCm ?? "-"}</td>
              <td className="py-2">{log.hipCm ?? "-"}</td>
              <td className="py-2">
                {log.photoUrls.length > 0 && (
                  <div className="flex gap-1">
                    {log.photoUrls.map((url) => (
                      <a key={url} href={resolveMediaUrl(url) ?? "#"} target="_blank" rel="noreferrer">
                        <img src={resolveMediaUrl(url) ?? undefined} alt="" className="h-10 w-10 rounded object-cover" />
                      </a>
                    ))}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {logs.length === 0 && <p className="text-gray-500">Henüz ölçüm kaydı yok.</p>}
    </div>
  );
}
