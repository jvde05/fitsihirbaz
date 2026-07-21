"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RequestPasswordResetInputSchema, type RequestPasswordResetInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [submitted, setSubmitted] = useState(false);
  const requestResetMutation = trpc.auth.requestPasswordReset.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RequestPasswordResetInput>({ resolver: zodResolver(RequestPasswordResetInputSchema) });

  async function onSubmit(values: RequestPasswordResetInput) {
    await requestResetMutation.mutateAsync(values);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <Alert>
        <AlertDescription>
          Bu e-posta adresine ait bir hesap varsa, şifre sıfırlama bağlantısı gönderildi. Gelen kutunu
          kontrol et.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="space-y-1.5">
        <Label htmlFor="email">E-posta</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Gönderiliyor..." : "Sıfırlama Bağlantısı Gönder"}
      </Button>
    </form>
  );
}
