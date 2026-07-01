"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { RegisterInputSchema, type RegisterInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { useAuthStore } from "@/lib/auth-store";

export function RegisterForm() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [serverError, setServerError] = useState<string | null>(null);
  const registerMutation = trpc.auth.register.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterInputSchema),
    defaultValues: { role: "CLIENT" },
  });

  async function onSubmit(values: RegisterInput) {
    setServerError(null);
    try {
      const result = await registerMutation.mutateAsync(values);
      setSession(result.user, result.tokens.accessToken);
      router.push("/");
      router.refresh();
    } catch (error) {
      setServerError(error instanceof Error ? error.message : "Kayıt başarısız oldu");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div>
        <span className="block text-sm font-medium text-gray-700">Hesap türü</span>
        <div className="mt-1 flex gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="CLIENT" {...register("role")} />
            Danışan
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="radio" value="DIETITIAN" {...register("role")} />
            Diyetisyen
          </label>
        </div>
        {errors.role && <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="firstName">
            Ad
          </label>
          <input
            id="firstName"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("firstName")}
          />
          {errors.firstName && <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="lastName">
            Soyad
          </label>
          <input
            id="lastName"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("lastName")}
          />
          {errors.lastName && <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="email">
          E-posta
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          {...register("email")}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="phone">
          Telefon (opsiyonel)
        </label>
        <input
          id="phone"
          type="tel"
          autoComplete="tel"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          {...register("phone")}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700" htmlFor="password">
          Şifre
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
          {...register("password")}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>

      {serverError && <p className="text-sm text-red-600">{serverError}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
      >
        {isSubmitting ? "Kayıt oluşturuluyor..." : "Kayıt Ol"}
      </button>
    </form>
  );
}
