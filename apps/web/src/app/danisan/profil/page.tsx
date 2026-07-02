"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateClientProfileInputSchema,
  UpdateProfileInputSchema,
  type UpdateClientProfileInput,
  type UpdateProfileInput,
} from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";

export default function DanisanProfilPage() {
  const utils = trpc.useUtils();
  const profileQuery = trpc.clients.getProfile.useQuery();

  const updateUserMutation = trpc.users.updateProfile.useMutation({
    onSuccess: () => utils.clients.getProfile.invalidate(),
  });
  const updateClientMutation = trpc.clients.updateProfile.useMutation({
    onSuccess: () => utils.clients.getProfile.invalidate(),
  });

  const userForm = useForm<UpdateProfileInput>({ resolver: zodResolver(UpdateProfileInputSchema) });
  const clientForm = useForm<UpdateClientProfileInput>({
    resolver: zodResolver(UpdateClientProfileInputSchema),
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    userForm.reset({
      firstName: profileQuery.data.firstName,
      lastName: profileQuery.data.lastName,
      phone: profileQuery.data.phone ?? "",
    });
    clientForm.reset({
      birthDate: profileQuery.data.birthDate ?? "",
      gender: profileQuery.data.gender ?? undefined,
      heightCm: profileQuery.data.heightCm ?? undefined,
      goal: profileQuery.data.goal ?? undefined,
      activityLevel: profileQuery.data.activityLevel ?? undefined,
      medicalNotes: profileQuery.data.medicalNotes ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);

  if (profileQuery.isLoading) {
    return <p className="text-gray-500">Yükleniyor...</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Profilim</h1>

      <form
        onSubmit={userForm.handleSubmit((values) => updateUserMutation.mutate(values))}
        className="flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <h2 className="text-sm font-semibold text-gray-700">Kişisel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Ad</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...userForm.register("firstName")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Soyad</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...userForm.register("lastName")}
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Telefon</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...userForm.register("phone")}
          />
        </div>
        {updateUserMutation.isSuccess && <p className="text-sm text-brand-700">Kaydedildi.</p>}
        <button
          type="submit"
          disabled={userForm.formState.isSubmitting}
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Kaydet
        </button>
      </form>

      <form
        onSubmit={clientForm.handleSubmit((values) => updateClientMutation.mutate(values))}
        className="flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <h2 className="text-sm font-semibold text-gray-700">Sağlık Bilgileri</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Doğum Tarihi</label>
            <input
              type="date"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...clientForm.register("birthDate")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Cinsiyet</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...clientForm.register("gender")}
            >
              <option value="">Seçiniz</option>
              <option value="MALE">Erkek</option>
              <option value="FEMALE">Kadın</option>
              <option value="OTHER">Diğer</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Boy (cm)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...clientForm.register("heightCm")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Hedef</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...clientForm.register("goal")}
            >
              <option value="">Seçiniz</option>
              <option value="WEIGHT_LOSS">Kilo Verme</option>
              <option value="WEIGHT_GAIN">Kilo Alma</option>
              <option value="MAINTENANCE">Koruma</option>
              <option value="MUSCLE_GAIN">Kas Kazanma</option>
              <option value="MEDICAL">Tıbbi</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Aktivite Seviyesi</label>
            <select
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...clientForm.register("activityLevel")}
            >
              <option value="">Seçiniz</option>
              <option value="SEDENTARY">Hareketsiz</option>
              <option value="LIGHT">Hafif</option>
              <option value="MODERATE">Orta</option>
              <option value="ACTIVE">Aktif</option>
              <option value="VERY_ACTIVE">Çok Aktif</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Sağlık Notları</label>
          <textarea
            rows={3}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...clientForm.register("medicalNotes")}
          />
        </div>
        {updateClientMutation.isSuccess && <p className="text-sm text-brand-700">Kaydedildi.</p>}
        <button
          type="submit"
          disabled={clientForm.formState.isSubmitting}
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Kaydet
        </button>
      </form>
    </div>
  );
}
