"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  UpdateDietitianProfileInputSchema,
  UpdateProfileInputSchema,
  type UpdateDietitianProfileInput,
  type UpdateProfileInput,
} from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

export default function DiyetisyenProfilPage() {
  const utils = trpc.useUtils();
  const profileQuery = trpc.dietitians.getProfile.useQuery();
  const [specialtiesInput, setSpecialtiesInput] = useState("");

  const updateUserMutation = trpc.users.updateProfile.useMutation({
    onSuccess: (user) => {
      useAuthStore.setState({ user });
      utils.dietitians.getProfile.invalidate();
    },
  });
  const updateDietitianMutation = trpc.dietitians.updateProfile.useMutation({
    onSuccess: () => utils.dietitians.getProfile.invalidate(),
  });

  const userForm = useForm<UpdateProfileInput>({ resolver: zodResolver(UpdateProfileInputSchema) });
  const dietitianForm = useForm<UpdateDietitianProfileInput>({
    resolver: zodResolver(UpdateDietitianProfileInputSchema),
  });

  useEffect(() => {
    if (!profileQuery.data) return;
    userForm.reset({
      firstName: profileQuery.data.firstName,
      lastName: profileQuery.data.lastName,
      phone: profileQuery.data.phone ?? "",
    });
    dietitianForm.reset({
      title: profileQuery.data.title ?? "",
      bio: profileQuery.data.bio ?? "",
      yearsOfExperience: profileQuery.data.yearsOfExperience ?? undefined,
      licenseNumber: profileQuery.data.licenseNumber ?? "",
    });
    setSpecialtiesInput(profileQuery.data.specialties.join(", "));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileQuery.data]);

  function handleDietitianSubmit(values: UpdateDietitianProfileInput) {
    const specialties = specialtiesInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    updateDietitianMutation.mutate({ ...values, specialties });
  }

  if (profileQuery.isLoading) {
    return <p className="text-gray-500">Yükleniyor...</p>;
  }

  if (profileQuery.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Profil yüklenemedi: {profileQuery.error.message}
        <button
          type="button"
          onClick={() => profileQuery.refetch()}
          className="ml-3 font-medium underline"
        >
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Profilim</h1>

      <div className="rounded-md border border-gray-200 p-4">
        <AvatarUploader
          avatarUrl={profileQuery.data?.avatarUrl ?? null}
          onUpdated={() => utils.dietitians.getProfile.invalidate()}
        />
      </div>

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
        onSubmit={dietitianForm.handleSubmit(handleDietitianSubmit)}
        className="flex flex-col gap-3 rounded-md border border-gray-200 p-4"
      >
        <h2 className="text-sm font-semibold text-gray-700">Uzmanlık Bilgileri</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700">Unvan</label>
          <input
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            placeholder="örn. Uzm. Dyt."
            {...dietitianForm.register("title")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Biyografi</label>
          <textarea
            rows={4}
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...dietitianForm.register("bio")}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Uzmanlık Alanları (virgülle ayırın)</label>
          <input
            value={specialtiesInput}
            onChange={(event) => setSpecialtiesInput(event.target.value)}
            placeholder="örn. Spor Beslenmesi, Diyabet"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Deneyim (yıl)</label>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...dietitianForm.register("yearsOfExperience")}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Lisans No</label>
            <input
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
              {...dietitianForm.register("licenseNumber")}
            />
          </div>
        </div>
        {updateDietitianMutation.isSuccess && <p className="text-sm text-brand-700">Kaydedildi.</p>}
        <button
          type="submit"
          disabled={dietitianForm.formState.isSubmitting}
          className="self-start rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          Kaydet
        </button>
      </form>
    </div>
  );
}
