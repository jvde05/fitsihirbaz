"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpsertFoodSourceInputSchema, type FoodSource, type UpsertFoodSourceInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const EMPTY_FORM: UpsertFoodSourceInput = {
  name: "",
  citation: "",
};

export default function AdminKaynaklarPage() {
  const utils = trpc.useUtils();
  const listQuery = trpc.admin.foodSources.list.useQuery();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const upsertMutation = trpc.admin.foodSources.upsert.useMutation({
    onSuccess: () => {
      setFormError(null);
      setEditingId(null);
      reset(EMPTY_FORM);
      utils.admin.foodSources.list.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const deleteMutation = trpc.admin.foodSources.delete.useMutation({
    onSuccess: () => {
      setDeleteError(null);
      utils.admin.foodSources.list.invalidate();
    },
    onError: (err) => setDeleteError(err.message),
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpsertFoodSourceInput>({
    resolver: zodResolver(UpsertFoodSourceInputSchema),
    defaultValues: EMPTY_FORM,
  });

  async function onSubmit(values: UpsertFoodSourceInput) {
    setFormError(null);
    await upsertMutation.mutateAsync(values);
  }

  function startEdit(item: FoodSource) {
    setFormError(null);
    setEditingId(item.id);
    reset({ id: item.id, name: item.name, citation: item.citation, url: item.url ?? undefined });
  }

  function cancelEdit() {
    setFormError(null);
    setEditingId(null);
    reset(EMPTY_FORM);
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Besin Kaynakçası</h1>
      <p className="mb-3 max-w-2xl text-sm text-muted-foreground">
        Besin veritabanındaki her kaydın dayandığı bilimsel kaynağı (ör. USDA FoodData Central, TÜBİTAK Besin
        Bileşim Veritabanı) burada yönetin.
      </p>
      <div className="mb-6 max-w-2xl rounded-md border border-primary/20 bg-accent p-3 text-sm text-accent-foreground">
        <strong className="font-semibold">Karıştırılmasın:</strong> bu sayfa besinlerin bilimsel atıflarını
        yönetir. Danışan/diyetisyenlere görünen makale kütüphanesi ayrı bir yerdedir —{" "}
        <span className="font-medium">İçerik / Literatür</span> sekmesinden yönetilir.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {editingId ? "Kaynağı Düzenle" : "Yeni Kaynak Ekle"}
          </h2>
          {editingId && <Badge variant="warning">Düzenleme modu</Badge>}
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fs-name">Kaynak Adı</Label>
            <Input id="fs-name" placeholder="ör. USDA FoodData Central" {...register("name")} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="fs-url">URL (opsiyonel)</Label>
            <Input id="fs-url" placeholder="https://fdc.nal.usda.gov" {...register("url")} />
            {errors.url && <p className="text-sm text-destructive">{errors.url.message}</p>}
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="fs-citation">Akademik Atıf Metni</Label>
            <Textarea
              id="fs-citation"
              rows={2}
              placeholder="ör. U.S. Department of Agriculture, Agricultural Research Service. FoodData Central, 2024."
              {...register("citation")}
            />
            {errors.citation && <p className="text-sm text-destructive">{errors.citation.message}</p>}
          </div>
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : editingId ? "Değişiklikleri Kaydet" : "Kaynağı Ekle"}
          </Button>
          <Button type="button" variant="outline" onClick={cancelEdit}>
            {editingId ? "Vazgeç" : "Formu Temizle"}
          </Button>
        </div>
      </form>

      {listQuery.isError && (
        <QueryErrorNotice message={listQuery.error.message} onRetry={() => listQuery.refetch()} />
      )}
      {deleteError && <p className="mb-3 text-sm text-destructive">{deleteError}</p>}

      {listQuery.isLoading && <Skeleton className="h-40 rounded-lg" />}

      {!listQuery.isLoading && listQuery.data && listQuery.data.length > 0 && (
        <ul className="divide-y rounded-md border">
          {listQuery.data.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate font-medium text-foreground">{item.name}</p>
                  <Badge variant="secondary">{item.foodItemCount} besin</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{item.citation}</p>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">
                    {item.url}
                  </a>
                )}
              </div>
              <div className="flex shrink-0 flex-col items-end gap-1">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                    Düzenle
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={item.foodItemCount > 0}
                    onClick={() => deleteMutation.mutate({ id: item.id })}
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                  >
                    Sil
                  </Button>
                </div>
                {item.foodItemCount > 0 && (
                  <p className="text-xs text-muted-foreground">Bağlı besin var, silinemez</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {!listQuery.isLoading && listQuery.data?.length === 0 && <EmptyState title="Henüz kaynak eklenmemiş" />}
    </div>
  );
}
