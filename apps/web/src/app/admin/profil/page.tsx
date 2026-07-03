"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateProfileInputSchema, type UpdateProfileInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { AvatarUploader } from "@/components/profile/AvatarUploader";

export default function AdminProfilPage() {
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery();

  const updateUserMutation = trpc.users.updateProfile.useMutation({
    onSuccess: (user) => {
      useAuthStore.setState({ user });
      utils.auth.me.invalidate();
    },
  });

  const userForm = useForm<UpdateProfileInput>({ resolver: zodResolver(UpdateProfileInputSchema) });

  useEffect(() => {
    if (!meQuery.data) return;
    userForm.reset({
      firstName: meQuery.data.firstName,
      lastName: meQuery.data.lastName,
      phone: meQuery.data.phone ?? "",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meQuery.data]);

  if (meQuery.isLoading) {
    return <p className="text-gray-500">Yükleniyor...</p>;
  }

  if (meQuery.isError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Profil yüklenemedi: {meQuery.error.message}
        <button type="button" onClick={() => meQuery.refetch()} className="ml-3 font-medium underline">
          Tekrar dene
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold text-gray-900">Profilim</h1>

      <div className="rounded-md border border-gray-200 p-4">
        <AvatarUploader avatarUrl={meQuery.data?.avatarUrl ?? null} onUpdated={() => utils.auth.me.invalidate()} />
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
    </div>
  );
}
