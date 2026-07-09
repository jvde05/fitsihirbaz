"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X } from "lucide-react";
import { AddProgressLogInputSchema, type AddProgressLogInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { WeightChart } from "@/components/WeightChart";
import { resolveMediaUrl } from "@/lib/media";
import { uploadImage } from "@/lib/uploads";
import { EmptyState } from "@/components/EmptyState";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
      <h1 className="mb-6 text-2xl font-semibold text-foreground">İlerleme</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Ölçümlerinizi ve isterseniz ilerleme fotoğraflarınızı buradan kaydedin. Kaydettiğiniz veriler
        otomatik olarak bağlı olduğunuz diyetisyeninizle paylaşılır.
      </p>

      {firstWeight !== null && latestWeight !== null && (
        <Card className="mb-6 p-4 text-sm text-foreground/90">
          İlk ölçüm: {firstWeight} kg → Son ölçüm: {latestWeight} kg (
          {(latestWeight - firstWeight).toFixed(1)} kg)
        </Card>
      )}

      <div className="mb-6">
        <WeightChart logs={logs} />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="logDate">Tarih</Label>
            <Input id="logDate" type="date" {...register("logDate")} />
            {errors.logDate && <p className="text-xs text-destructive">{errors.logDate.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="weightKg">Kilo (kg)</Label>
            <Input id="weightKg" type="number" step="0.1" {...register("weightKg")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bodyFatPercent">Vücut Yağ Oranı (%)</Label>
            <Input id="bodyFatPercent" type="number" step="0.1" {...register("bodyFatPercent")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="waistCm">Bel (cm)</Label>
            <Input id="waistCm" type="number" step="0.1" {...register("waistCm")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="hipCm">Kalça (cm)</Label>
            <Input id="hipCm" type="number" step="0.1" {...register("hipCm")} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">Notlar</Label>
          <Textarea id="notes" rows={2} {...register("notes")} />
        </div>

        <div>
          <Label>İlerleme Fotoğrafları (opsiyonel)</Label>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            {photoUrls.map((url) => (
              <div key={url} className="relative">
                <img src={resolveMediaUrl(url) ?? undefined} alt="" className="h-16 w-16 rounded-md object-cover" />
                <button
                  type="button"
                  onClick={() => setPhotoUrls((current) => current.filter((u) => u !== url))}
                  className="absolute -right-1 -top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <label className="cursor-pointer text-sm text-primary hover:underline">
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

        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={isSubmitting || uploadingPhoto} className="self-start">
          {isSubmitting ? "Kaydediliyor..." : "Ölçüm Ekle"}
        </Button>
      </form>

      {logs.length > 0 && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tarih</TableHead>
              <TableHead>Kilo</TableHead>
              <TableHead>Yağ Oranı</TableHead>
              <TableHead>Bel</TableHead>
              <TableHead>Kalça</TableHead>
              <TableHead>Fotoğraflar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...logs].reverse().map((log) => (
              <TableRow key={log.id}>
                <TableCell>{log.logDate}</TableCell>
                <TableCell>{log.weightKg ?? "-"}</TableCell>
                <TableCell>{log.bodyFatPercent !== null ? `${log.bodyFatPercent}%` : "-"}</TableCell>
                <TableCell>{log.waistCm ?? "-"}</TableCell>
                <TableCell>{log.hipCm ?? "-"}</TableCell>
                <TableCell>
                  {log.photoUrls.length > 0 && (
                    <div className="flex gap-1">
                      {log.photoUrls.map((url) => (
                        <a key={url} href={resolveMediaUrl(url) ?? "#"} target="_blank" rel="noreferrer">
                          <img src={resolveMediaUrl(url) ?? undefined} alt="" className="h-10 w-10 rounded object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      {logs.length === 0 && <EmptyState title="Henüz ölçüm kaydı yok" />}
    </div>
  );
}
