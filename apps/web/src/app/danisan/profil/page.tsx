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
import { useAuthStore } from "@/lib/auth-store";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const nativeSelectClass =
  "mt-1 h-9 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export default function DanisanProfilPage() {
  const utils = trpc.useUtils();
  const profileQuery = trpc.clients.getProfile.useQuery();

  const updateUserMutation = trpc.users.updateProfile.useMutation({
    onSuccess: (user) => {
      useAuthStore.setState({ user });
      utils.clients.getProfile.invalidate();
    },
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
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }

  if (profileQuery.isError) {
    return <QueryErrorNotice message={profileQuery.error.message} onRetry={() => profileQuery.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Profilim</h1>

      <Card className="p-4">
        <AvatarUploader
          avatarUrl={profileQuery.data?.avatarUrl ?? null}
          onUpdated={() => utils.clients.getProfile.invalidate()}
        />
      </Card>

      <form
        onSubmit={userForm.handleSubmit((values) => updateUserMutation.mutate(values))}
        className="flex flex-col gap-3 rounded-md border p-4"
      >
        <h2 className="text-sm font-semibold text-foreground">Kişisel Bilgiler</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Ad</Label>
            <Input {...userForm.register("firstName")} />
          </div>
          <div className="space-y-1.5">
            <Label>Soyad</Label>
            <Input {...userForm.register("lastName")} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Telefon</Label>
          <Input {...userForm.register("phone")} />
        </div>
        {updateUserMutation.isSuccess && <p className="text-sm text-primary">Kaydedildi.</p>}
        <Button type="submit" disabled={userForm.formState.isSubmitting} className="self-start">
          Kaydet
        </Button>
      </form>

      <form
        onSubmit={clientForm.handleSubmit((values) => updateClientMutation.mutate(values))}
        className="flex flex-col gap-3 rounded-md border p-4"
      >
        <h2 className="text-sm font-semibold text-foreground">Sağlık Bilgileri</h2>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Doğum Tarihi</Label>
            <Input type="date" {...clientForm.register("birthDate")} />
          </div>
          <div>
            <Label>Cinsiyet</Label>
            <select className={nativeSelectClass} {...clientForm.register("gender")}>
              <option value="">Seçiniz</option>
              <option value="MALE">Erkek</option>
              <option value="FEMALE">Kadın</option>
              <option value="OTHER">Diğer</option>
            </select>
          </div>
          <div>
            <Label>Boy (cm)</Label>
            <Input type="number" {...clientForm.register("heightCm")} />
          </div>
          <div>
            <Label>Hedef</Label>
            <select className={nativeSelectClass} {...clientForm.register("goal")}>
              <option value="">Seçiniz</option>
              <option value="WEIGHT_LOSS">Kilo Verme</option>
              <option value="WEIGHT_GAIN">Kilo Alma</option>
              <option value="MAINTENANCE">Koruma</option>
              <option value="MUSCLE_GAIN">Kas Kazanma</option>
              <option value="MEDICAL">Tıbbi</option>
            </select>
          </div>
          <div>
            <Label>Aktivite Seviyesi</Label>
            <select className={nativeSelectClass} {...clientForm.register("activityLevel")}>
              <option value="">Seçiniz</option>
              <option value="SEDENTARY">Hareketsiz</option>
              <option value="LIGHT">Hafif</option>
              <option value="MODERATE">Orta</option>
              <option value="ACTIVE">Aktif</option>
              <option value="VERY_ACTIVE">Çok Aktif</option>
            </select>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Sağlık Notları</Label>
          <Textarea rows={3} {...clientForm.register("medicalNotes")} />
        </div>
        {updateClientMutation.isSuccess && <p className="text-sm text-primary">Kaydedildi.</p>}
        <Button type="submit" disabled={clientForm.formState.isSubmitting} className="self-start">
          Kaydet
        </Button>
      </form>
    </div>
  );
}
