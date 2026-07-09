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
import { CertificationUploader } from "@/components/profile/CertificationUploader";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
          onUpdated={() => utils.dietitians.getProfile.invalidate()}
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
        onSubmit={dietitianForm.handleSubmit(handleDietitianSubmit)}
        className="flex flex-col gap-3 rounded-md border p-4"
      >
        <h2 className="text-sm font-semibold text-foreground">Uzmanlık Bilgileri</h2>
        <div className="space-y-1.5">
          <Label>Unvan</Label>
          <Input placeholder="örn. Uzm. Dyt." {...dietitianForm.register("title")} />
        </div>
        <div className="space-y-1.5">
          <Label>Biyografi</Label>
          <Textarea rows={4} {...dietitianForm.register("bio")} />
        </div>
        <div className="space-y-1.5">
          <Label>Uzmanlık Alanları (virgülle ayırın)</Label>
          <Input
            value={specialtiesInput}
            onChange={(event) => setSpecialtiesInput(event.target.value)}
            placeholder="örn. Spor Beslenmesi, Diyabet"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Deneyim (yıl)</Label>
            <Input type="number" {...dietitianForm.register("yearsOfExperience")} />
          </div>
          <div className="space-y-1.5">
            <Label>Lisans No</Label>
            <Input {...dietitianForm.register("licenseNumber")} />
          </div>
        </div>
        {updateDietitianMutation.isSuccess && <p className="text-sm text-primary">Kaydedildi.</p>}
        <Button type="submit" disabled={dietitianForm.formState.isSubmitting} className="self-start">
          Kaydet
        </Button>
      </form>

      <Card className="p-4">
        <CertificationUploader
          certificationUrls={profileQuery.data?.certificationUrls ?? []}
          onUpdated={() => utils.dietitians.getProfile.invalidate()}
        />
      </Card>
    </div>
  );
}
