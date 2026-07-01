"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreatePackageInputSchema, type CreatePackageInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";

export default function PaketlerPage() {
  const utils = trpc.useUtils();
  const packagesQuery = trpc.packages.list.useQuery();
  const [formError, setFormError] = useState<string | null>(null);

  const createMutation = trpc.packages.create.useMutation({
    onSuccess: () => {
      reset();
      setFormError(null);
      utils.packages.list.invalidate();
    },
    onError: (err) => setFormError(err.message),
  });

  const updateMutation = trpc.packages.update.useMutation({
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
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Paketlerim</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mb-8 flex flex-col gap-3 rounded-md border border-gray-200 p-4">
        <h2 className="text-sm font-semibold text-gray-700">Yeni Paket</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="title">
              Başlık
            </label>
            <input
              id="title"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("title")}
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="price">
              Fiyat (TRY)
            </label>
            <input
              id="price"
              type="number"
              min="1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("price")}
            />
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="durationDays">
              Süre (gün)
            </label>
            <input
              id="durationDays"
              type="number"
              min="1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("durationDays")}
            />
            {errors.durationDays && <p className="mt-1 text-sm text-red-600">{errors.durationDays.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700" htmlFor="sessionCount">
              Görüşme Sayısı (opsiyonel)
            </label>
            <input
              id="sessionCount"
              type="number"
              min="1"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...register("sessionCount")}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="description">
            Açıklama (opsiyonel)
          </label>
          <textarea
            id="description"
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("description")}
          />
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="self-start rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Oluşturuluyor..." : "Paket Oluştur"}
        </button>
      </form>

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {packagesQuery.data?.map((pkg) => (
          <li key={pkg.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className="font-medium text-gray-900">
                {pkg.title}{" "}
                <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${pkg.isActive ? "bg-brand-100 text-brand-700" : "bg-gray-100 text-gray-500"}`}>
                  {pkg.isActive ? "Aktif" : "Pasif"}
                </span>
              </p>
              <p className="text-sm text-gray-500">
                {pkg.durationDays} gün · {pkg.price} {pkg.currency}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
              className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            >
              {pkg.isActive ? "Pasife Al" : "Aktifleştir"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
