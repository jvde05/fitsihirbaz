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
    <form onSubmit={handleSubmit(onSubmit)} className="w-full rounded-md border border-brand-200 bg-brand-50 p-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor={`edit-title-${pkg.id}`}>
            Başlık
          </label>
          <input
            id={`edit-title-${pkg.id}`}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("title")}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor={`edit-price-${pkg.id}`}>
            Fiyat (TRY)
          </label>
          <input
            id={`edit-price-${pkg.id}`}
            type="number"
            min="1"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("price")}
          />
          {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor={`edit-duration-${pkg.id}`}>
            Süre (gün)
          </label>
          <input
            id={`edit-duration-${pkg.id}`}
            type="number"
            min="1"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("durationDays")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor={`edit-session-${pkg.id}`}>
            Görüşme Sayısı (opsiyonel)
          </label>
          <input
            id={`edit-session-${pkg.id}`}
            type="number"
            min="1"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("sessionCount")}
          />
        </div>
      </div>
      <div className="mt-3">
        <label className="block text-sm font-medium text-gray-700" htmlFor={`edit-description-${pkg.id}`}>
          Açıklama (opsiyonel)
        </label>
        <textarea
          id={`edit-description-${pkg.id}`}
          rows={2}
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          {...register("description")}
        />
      </div>
      {formError && <p className="mt-2 text-sm text-red-600">{formError}</p>}
      <div className="mt-3 flex gap-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Kaydediliyor..." : "Kaydet"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          İptal
        </button>
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

      {packagesQuery.isError && (
        <QueryErrorNotice message={packagesQuery.error.message} onRetry={() => packagesQuery.refetch()} />
      )}

      <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
        {packagesQuery.data?.map((pkg) =>
          editingId === pkg.id ? (
            <li key={pkg.id} className="px-4 py-3">
              <EditPackageForm pkg={pkg} onDone={() => setEditingId(null)} />
            </li>
          ) : (
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingId(pkg.id)}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  Düzenle
                </button>
                <button
                  type="button"
                  onClick={() => toggleActiveMutation.mutate({ id: pkg.id, isActive: !pkg.isActive })}
                  className="rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
                >
                  {pkg.isActive ? "Pasife Al" : "Aktifleştir"}
                </button>
              </div>
            </li>
          ),
        )}
      </ul>
    </div>
  );
}
