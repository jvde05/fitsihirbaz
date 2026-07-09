"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CreatePackageInputSchema,
  UpdatePackageInputSchema,
  type CreatePackageInput,
  type Package,
  type UpdatePackageInput,
} from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function EditPackageForm({ pkg, onDone }: { pkg: Package; onDone: () => void }) {
  const utils = trpc.useUtils();
  const [formError, setFormError] = useState<string | null>(null);

  const updateMutation = trpc.packages.update.useMutation({
    onSuccess: () => {
      setFormError(null);
      utils.packages.list.invalidate();
      onDone();
    },
    onError: (err) => setFormError(err.message),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<UpdatePackageInput>({
    resolver: zodResolver(UpdatePackageInputSchema),
    defaultValues: {
      id: pkg.id,
      title: pkg.title,
      description: pkg.description ?? undefined,
      durationDays: pkg.durationDays,
      sessionCount: pkg.sessionCount ?? undefined,
      price: pkg.price,
    },
  });

  async function onSubmit(values: UpdatePackageInput) {
    setFormError(null);
    await updateMutation.mutateAsync(values);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full rounded-md border border-primary/20 bg-accent p-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor={`edit-title-${pkg.id}`}>Başlık</Label>
          <Input id={`edit-title-${pkg.id}`} {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-price-${pkg.id}`}>Fiyat (TRY)</Label>
          <Input id={`edit-price-${pkg.id}`} type="number" min="1" {...register("price")} />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-duration-${pkg.id}`}>Süre (gün)</Label>
          <Input id={`edit-duration-${pkg.id}`} type="number" min="1" {...register("durationDays")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`edit-session-${pkg.id}`}>Görüşme Sayısı (opsiyonel)</Label>
          <Input id={`edit-session-${pkg.id}`} type="number" min="1" {...register("sessionCount")} />
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <Label htmlFor={`edit-description-${pkg.id}`}>Açıklama (opsiyonel)</Label>
        <Textarea id={`edit-description-${pkg.id}`} rows={2} {...register("description")} />
      </div>
      {formError && <p className="mt-2 text-sm text-destructive">{formError}</p>}
      <div className="mt-3 flex gap-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </Button>
        <Button type="button" variant="outline" onClick={onDone}>
          İptal
        </Button>
      </div>
    </form>
  );
}

export default function PaketlerPage() {
  const utils = trpc.useUtils();
  const packagesQuery = trpc.packages.list.useQuery();
  const [formError, setFormError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const createMutation = trpc.packages.create.useMutation({
    onSuccess: () => {
      reset();
      setFormError(null);
      utils.packages.list.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const toggleActiveMutation = trpc.packages.update.useMutation({
    onSuccess: () => utils.packages.list.invalidate(),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePackageInput>({
    resolver: zodResolver(CreatePackageInputSchema),
    defaultValues: { currency: "TRY" },
  });

  async function onSubmit(values: CreatePackageInput) {
    setFormError(null);
    await createMutation.mutateAsync(values);
  }

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Paketlerim</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border p-4">
        <h2 className="text-sm font-semibold text-foreground">Yeni Paket</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Başlık</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="price">Fiyat (TRY)</Label>
            <Input id="price" type="number" min="1" {...register("price")} />
            {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="durationDays">Süre (gün)</Label>
            <Input id="durationDays" type="number" min="1" {...register("durationDays")} />
            {errors.durationDays && <p className="text-sm text-destructive">{errors.durationDays.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="sessionCount">Görüşme Sayısı (opsiyonel)</Label>
            <Input id="sessionCount" type="number" min="1" {...register("sessionCount")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="description">Açıklama (opsiyonel)</Label>
          <Textarea id="description" rows={3} {...register("description")} />
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <Button type="submit" disabled={isSubmitting} className="self-start">
          {isSubmitting ? "Oluşturuluyor..." : "Paket Oluştur"}
        </Button>
      </form>

      {packagesQuery.isError && (
        <QueryErrorNotice message={packagesQuery.error.message} onRetry={() => packagesQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {packagesQuery.data?.map((pkg) =>
          editingId === pkg.id ? (
            <li key={pkg.id} className="px-4 py-3">
              <EditPackageForm pkg={pkg} onDone={() => setEditingId(null)} />
            </li>
          ) : (
            <li key={pkg.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{pkg.title}</p>
                  <Badge variant={pkg.isActive ? "success" : "secondary"}>
                    {pkg.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  {pkg.durationDays} gün · {pkg.price} {pkg.currency}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditingId(pkg.id)}>
                  Düzenle
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleActiveMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                >
                  {pkg.isActive ? "Pasife Al" : "Aktifleştir"}
                </Button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
