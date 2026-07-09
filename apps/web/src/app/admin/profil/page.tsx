"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { UpdateProfileInputSchema, type UpdateProfileInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";
import { AvatarUploader } from "@/components/profile/AvatarUploader";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }

  if (meQuery.isError) {
    return <QueryErrorNotice message={meQuery.error.message} onRetry={() => meQuery.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-xl space-y-8">
      <h1 className="text-2xl font-semibold text-foreground">Profilim</h1>

      <Card className="p-4">
        <AvatarUploader avatarUrl={meQuery.data?.avatarUrl ?? null} onUpdated={() => utils.auth.me.invalidate()} />
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
    </div>
  );
}
