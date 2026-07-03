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
      <h1 className="mb-2 text-2xl font-semibold text-gray-900">Referans Alım Değerleri Yönetimi</h1>
      <p className="mb-6 max-w-2xl text-sm text-gray-500">
        Yaş/cinsiyet/yaşam evresine göre günlük referans besin öğesi alım değerlerini yönetin. Resmi TÜBER
        kaynağıyla teyit edilmemiş değerlerde &quot;Doğrulanmış kaynak&quot; kutucuğunu işaretlemeyin —
        kullanıcı arayüzünde bu değerler otomatik olarak &quot;Doğrulanmamış&quot; etiketiyle gösterilir.
      </p>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-8 flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <h2 className="text-sm font-semibold text-gray-700">Referans Değer Ekle / Düzenle</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-nutrient">
              Besin Öğesi Kodu
            </label>
            <input
              id="ri-nutrient"
              placeholder="ör. ENERGY, PROTEIN"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("nutrient")}
            />
            {errors.nutrient && <p className="mt-1 text-sm text-red-600">{errors.nutrient.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-unit">
              Birim
            </label>
            <input
              id="ri-unit"
              placeholder="ör. kcal, g, mg"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("unit")}
            />
            {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-value">
              Değer
            </label>
            <input
              id="ri-value"
              type="number"
              step="0.1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("value")}
            />
            {errors.value && <p className="mt-1 text-sm text-red-600">{errors.value.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-age-min">
              Min Yaş
            </label>
            <input
              id="ri-age-min"
              type="number"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("ageMinYears")}
            />
            {errors.ageMinYears && <p className="mt-1 text-sm text-red-600">{errors.ageMinYears.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-age-max">
              Max Yaş (boş = üst sınır yok)
            </label>
            <input
              id="ri-age-max"
              type="number"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("ageMaxYears")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-sex">
              Cinsiyet
            </label>
            <select
              id="ri-sex"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("sex")}
            >
              {Object.entries(REFERENCE_SEX_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-life-stage">
              Yaşam Evresi
            </label>
            <select
              id="ri-life-stage"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("lifeStage")}
            >
              {Object.entries(REFERENCE_LIFE_STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2 sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-source">
              Kaynak Açıklaması
            </label>
            <input
              id="ri-source"
              placeholder="ör. Türkiye Beslenme Rehberi (TÜBER) 2022, s. 45"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("sourceLabel")}
            />
            {errors.sourceLabel && <p className="mt-1 text-sm text-red-600">{errors.sourceLabel.message}</p>}
          </div>
          <div className="col-span-2 sm:col-span-3">
            <label className="block text-sm font-medium text-gray-700" htmlFor="ri-notes">
              Not (opsiyonel)
            </label>
            <textarea
              id="ri-notes"
              rows={2}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("notes")}
            />
          </div>
          <div className="flex items-center gap-2">
            <input id="ri-verified" type="checkbox" className="h-4 w-4" {...register("isVerifiedSource")} />
            <label className="text-sm text-gray-700" htmlFor="ri-verified">
              Doğrulanmış kaynak (resmi TÜBER kaynağıyla teyit edildi)
            </label>
          </div>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
          >
            {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
          </button>
          <button
            type="button"
            onClick={() => reset(EMPTY_FORM)}
            className="self-start rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
          >
            Formu Temizle
          </button>
        </div>
      </form>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {listQuery.data?.map((item) => (
          <li key={item.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">
                {REFERENCE_NUTRIENT_LABELS[item.nutrient] ?? item.nutrient}
                <span
                  className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
                    item.isVerifiedSource ? "bg-brand-100 text-brand-700" : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {item.isVerifiedSource ? "Doğrulanmış" : "Doğrulanmamış"}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                {item.ageMinYears}
                {item.ageMaxYears !== null ? `-${item.ageMaxYears}` : "+"} yaş ·{" "}
                {REFERENCE_SEX_LABELS[item.sex]} · {REFERENCE_LIFE_STAGE_LABELS[item.lifeStage]} · {item.value}{" "}
                {item.unit}
              </p>
              <p className="text-xs text-gray-400">{item.sourceLabel}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => startEdit(item)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
              >
                Düzenle
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate({ id: item.id })}
                className="rounded-md border border-red-300 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Sil
              </button>
            </div>
          </li>
        ))}
      </ul>
      {listQuery.data?.length === 0 && <p className="mt-4 text-gray-500">Henüz referans değer eklenmemiş.</p>}
    </div>
  );
}
