"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ResetPasswordInputSchema } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

// Şifre tekrar alanı sadece UI'da doğrulanır, token+password çifti sunucuya olduğu gibi gider.
const FormSchema = ResetPasswordInputSchema.extend({
  confirmPassword: z.string().min(1, "Şifre tekrarı zorunlu"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Şifreler eşleşmiyor",
  path: ["confirmPassword"],
});
type FormValues = z.infer<typeof FormSchema>;

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const resetPasswordMutation = trpc.auth.resetPassword.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { token },
  });

  async function onSubmit(values: FormValues) {
    setServerError(null);
    try {
      await resetPasswordMutation.mutateAsync({ token: values.token, password: values.password });
      setSuccess(true);
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Şifre sıfırlama başarısız oldu");
    }
  }

  if (!token) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Bağlantı geçersiz. Şifre sıfırlama e-postasındaki linki kullan.</AlertDescription>
      </Alert>
    );
  }

  if (success) {
    return (
      <Alert>
        <AlertDescription>
          Şifren güncellendi.{" "}
          <Link href="/giris" className="font-medium text-primary hover:underline">
            Giriş yap
          </Link>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <input type="hidden" {...register("token")} value={token} />
      <div className="space-y-1.5">
        <Label htmlFor="password">Yeni Şifre</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Yeni Şifre (Tekrar)</Label>
        <Input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
        )}
      </div>
      {serverError && <p className="text-sm text-destructive">{serverError}</p>}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? "Kaydediliyor..." : "Şifreyi Güncelle"}
      </Button>
    </form>
  );
}
