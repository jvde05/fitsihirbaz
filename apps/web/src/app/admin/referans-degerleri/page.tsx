"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  REFERENCE_LIFE_STAGE_LABELS,
  REFERENCE_NUTRIENT_LABELS,
  REFERENCE_SEX_LABELS,
  UpsertReferenceIntakeInputSchema,
  type ReferenceIntake,
  type UpsertReferenceIntakeInput,
} from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { EmptyState } from "@/components/EmptyState";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMPTY_FORM: UpsertReferenceIntakeInput = {
  nutrient: "",
  unit: "",
  ageMinYears: 0,
  sex: "ALL",
  lifeStage: "NONE",
  value: 0,
  sourceLabel: "",
  isVerifiedSource: false,
};

export default function AdminReferansDegerleriPage() {
  const utils = trpc.useUtils();
  const listQuery = trpc.referenceIntakes.list.useQuery({});

  const [formError, setFormError] = useState<string | null>(null);
  const upsertMutation = trpc.admin.referenceIntakes.upsert.useMutation({
    onSuccess: () => {
      setFormError(null);
      reset(EMPTY_FORM);
      utils.referenceIntakes.list.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });
  const deleteMutation = trpc.admin.referenceIntakes.delete.useMutation({
    onSuccess: () => utils.referenceIntakes.list.invalidate(),
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<UpsertReferenceIntakeInput>({
    resolver: zodResolver(UpsertReferenceIntakeInputSchema),
    defaultValues: EMPTY_FORM,
  });

  async function onSubmit(values: UpsertReferenceIntakeInput) {
    setFormError(null);
    await upsertMutation.mutateAsync(values);
  }

  function startEdit(item: ReferenceIntake) {
    reset({
      id: item.id,
      nutrient: item.nutrient,
      unit: item.unit,
      ageMinYears: item.ageMinYears,
      ageMaxYears: item.ageMaxYears ?? undefined,
      sex: item.sex,
      lifeStage: item.lifeStage,
      value: item.value,
      sourceLabel: item.sourceLabel,
      isVerifiedSource: item.isVerifiedSource,
      notes: item.notes ?? undefined,
    });
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Referans Alım Değerleri Yönetimi</h1>
      <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
        Yaş/cinsiyet/yaşam evresine göre günlük referans besin öğesi alım değerlerini yönetin. Resmi TÜBER
        kaynağıyla teyit edilmemiş değerlerde &quot;Doğrulanmış kaynak&quot; kutucuğunu işaretlemeyin —
        kullanıcı arayüzünde bu değerler otomatik olarak &quot;Doğrulanmamış&quot; etiketiyle gösterilir.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border p-4">
        <h2 className="text-sm font-semibold text-foreground">Referans Değer Ekle / Düzenle</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="ri-nutrient">Besin Öğesi Kodu</Label>
            <Input id="ri-nutrient" placeholder="ör. ENERGY, PROTEIN" {...register("nutrient")} />
            {errors.nutrient && <p className="text-sm text-destructive">{errors.nutrient.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ri-unit">Birim</Label>
            <Input id="ri-unit" placeholder="ör. kcal, g, mg" {...register("unit")} />
            {errors.unit && <p className="text-sm text-destructive">{errors.unit.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ri-value">Değer</Label>
            <Input id="ri-value" type="number" step="0.1" {...register("value")} />
            {errors.value && <p className="text-sm text-destructive">{errors.value.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ri-age-min">Min Yaş</Label>
            <Input id="ri-age-min" type="number" {...register("ageMinYears")} />
            {errors.ageMinYears && <p className="text-sm text-destructive">{errors.ageMinYears.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ri-age-max">Max Yaş (boş = üst sınır yok)</Label>
            <Input id="ri-age-max" type="number" {...register("ageMaxYears")} />
          </div>
          <div className="space-y-1.5">
            <Label>Cinsiyet</Label>
            <Select value={watch("sex")} onValueChange={(value) => setValue("sex", value as UpsertReferenceIntakeInput["sex"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REFERENCE_SEX_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Yaşam Evresi</Label>
            <Select
              value={watch("lifeStage")}
              onValueChange={(value) => setValue("lifeStage", value as UpsertReferenceIntakeInput["lifeStage"])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(REFERENCE_LIFE_STAGE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2 space-y-1.5 sm:col-span-3">
            <Label htmlFor="ri-source">Kaynak Açıklaması</Label>
            <Input id="ri-source" placeholder="ör. Türkiye Beslenme Rehberi (TÜBER) 2022, s. 45" {...register("sourceLabel")} />
            {errors.sourceLabel && <p className="text-sm text-destructive">{errors.sourceLabel.message}</p>}
          </div>
          <div className="col-span-2 space-y-1.5 sm:col-span-3">
            <Label htmlFor="ri-notes">Not (opsiyonel)</Label>
            <Textarea id="ri-notes" rows={2} {...register("notes")} />
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="ri-verified"
              checked={watch("isVerifiedSource")}
              onCheckedChange={(checked) => setValue("isVerifiedSource", checked === true)}
            />
            <Label htmlFor="ri-verified" className="font-normal">
              Doğrulanmış kaynak (resmi TÜBER kaynağıyla teyit edildi)
            </Label>
          </div>
        </div>
        {formError && <p className="text-sm text-destructive">{formError}</p>}
        <div className="flex gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </Button>
          <Button type="button" variant="outline" onClick={() => reset(EMPTY_FORM)}>
            Formu Temizle
          </Button>
        </div>
      </form>

      {listQuery.isError && (
        <QueryErrorNotice message={listQuery.error.message} onRetry={() => listQuery.refetch()} />
      )}

      <ul className="divide-y rounded-md border">
        {listQuery.data?.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">
                  {REFERENCE_NUTRIENT_LABELS[item.nutrient] ?? item.nutrient}
                </p>
                <Badge variant={item.isVerifiedSource ? "success" : "warning"}>
                  {item.isVerifiedSource ? "Doğrulanmış" : "Doğrulanmamış"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {item.ageMinYears}
                {item.ageMaxYears !== null ? `-${item.ageMaxYears}` : "+"} yaş ·{" "}
                {REFERENCE_SEX_LABELS[item.sex]} · {REFERENCE_LIFE_STAGE_LABELS[item.lifeStage]} · {item.value}{" "}
                {item.unit}
              </p>
              <p className="text-xs text-muted-foreground/80">{item.sourceLabel}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => startEdit(item)}>
                Düzenle
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                onClick={() => deleteMutation.mutate({ id: item.id })}
              >
                Sil
              </Button>
            </div>
          </li>
        ))}
      </ul>
      {listQuery.data?.length === 0 && <EmptyState title="Henüz referans değer eklenmemiş" />}
    </div>
  );
}
