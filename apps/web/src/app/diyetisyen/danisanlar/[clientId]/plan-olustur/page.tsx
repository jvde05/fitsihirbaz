"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateDietPlanInputSchema, type CreateDietPlanInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { DietPlanBuilder } from "@/components/diet-plans/DietPlanBuilder";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";

export default function PlanOlusturPage() {
  const params = useParams<{ clientId: string }>();
  const clientId = params.clientId;
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const existingPlansQuery = trpc.dietPlans.list.useQuery({ clientId });
  const createMutation = trpc.dietPlans.create.useMutation({
    onSuccess: (plan) => setSelectedPlanId(plan.id),
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateDietPlanInput>({
    resolver: zodResolver(CreateDietPlanInputSchema),
    defaultValues: { clientId },
  });

  async function onSubmit(values: CreateDietPlanInput) {
    await createMutation.mutateAsync({ ...values, clientId });
  }

  if (selectedPlanId) {
    return <DietPlanBuilder planId={selectedPlanId} />;
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="mb-6 text-2xl font-semibold text-gray-900">Diyet Planı Oluştur</h1>

      {existingPlansQuery.isError && (
        <QueryErrorNotice
          message={existingPlansQuery.error.message}
          onRetry={() => existingPlansQuery.refetch()}
        />
      )}

      {existingPlansQuery.data && existingPlansQuery.data.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-gray-700">Bu danışan için mevcut planlar</h2>
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200">
            {existingPlansQuery.data.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between px-4 py-2">
                <span className="text-sm">
                  {plan.title} ({plan.status})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  Devam Et
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="title">
            Plan Başlığı
          </label>
          <input
            id="title"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("title")}
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="startDate">
            Başlangıç Tarihi
          </label>
          <input
            id="startDate"
            type="date"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("startDate")}
          />
          {errors.startDate && <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700" htmlFor="targetCalories">
            Hedef Kalori (opsiyonel)
          </label>
          <input
            id="targetCalories"
            type="number"
            min="1"
            className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
            {...register("targetCalories")}
          />
        </div>
        {createMutation.error && (
          <p className="text-sm text-red-600">{createMutation.error.message}</p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-md bg-brand-600 px-4 py-2 font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {isSubmitting ? "Oluşturuluyor..." : "Planı Oluştur ve Devam Et"}
        </button>
      </form>
    </div>
  );
}
