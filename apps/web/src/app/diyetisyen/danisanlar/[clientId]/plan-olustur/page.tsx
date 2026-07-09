"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CreateDietPlanInputSchema, type CreateDietPlanInput } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";
import { DietPlanBuilder } from "@/components/diet-plans/DietPlanBuilder";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
      <h1 className="mb-6 text-2xl font-semibold text-foreground">Diyet Planı Oluştur</h1>

      {existingPlansQuery.isError && (
        <QueryErrorNotice
          message={existingPlansQuery.error.message}
          onRetry={() => existingPlansQuery.refetch()}
        />
      )}

      {existingPlansQuery.data && existingPlansQuery.data.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-foreground">Bu danışan için mevcut planlar</h2>
          <ul className="divide-y rounded-md border">
            {existingPlansQuery.data.map((plan) => (
              <li key={plan.id} className="flex items-center justify-between px-4 py-2">
                <span className="text-sm">
                  {plan.title} ({plan.status})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPlanId(plan.id)}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  Devam Et
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Plan Başlığı</Label>
          <Input id="title" {...register("title")} />
          {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Başlangıç Tarihi</Label>
          <Input id="startDate" type="date" {...register("startDate")} />
          {errors.startDate && <p className="text-sm text-destructive">{errors.startDate.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="targetCalories">Hedef Kalori (opsiyonel)</Label>
          <Input id="targetCalories" type="number" min="1" {...register("targetCalories")} />
        </div>
        {createMutation.error && <p className="text-sm text-destructive">{createMutation.error.message}</p>}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Oluşturuluyor..." : "Planı Oluştur ve Devam Et"}
        </Button>
      </form>
    </div>
  );
}
