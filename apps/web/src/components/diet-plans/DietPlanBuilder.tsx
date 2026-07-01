"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { MealType } from "@fit-sihirbaz/shared";
import { MealItemAdder } from "./MealItemAdder";
import { MEAL_TYPE_LABELS, TotalsBadge } from "./diet-plan-ui";

export function DietPlanBuilder({ planId }: { planId: string }) {
  const utils = trpc.useUtils();
  const planQuery = trpc.dietPlans.getById.useQuery({ id: planId });
  const [newCalorieTarget, setNewCalorieTarget] = useState("");
  const [duplicateResultId, setDuplicateResultId] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);

  function refetchPlan() {
    utils.dietPlans.getById.invalidate({ id: planId });
  }

  const addDayMutation = trpc.dietPlans.addDay.useMutation({ onSuccess: refetchPlan });
  const addMealMutation = trpc.dietPlans.addMeal.useMutation({ onSuccess: refetchPlan });
  const duplicateMutation = trpc.dietPlans.duplicateForNewCalorieTarget.useMutation({
    onSuccess: (result) => {
      setDuplicateError(null);
      setDuplicateResultId(result.id);
    },
    onError: (err) => setDuplicateError(err.message),
  });

  const [pendingMealDayId, setPendingMealDayId] = useState<string | null>(null);
  const [pendingMealType, setPendingMealType] = useState<MealType>("BREAKFAST");

  if (planQuery.isLoading || !planQuery.data) {
    return <p className="text-gray-500">Plan yükleniyor...</p>;
  }
  const plan = planQuery.data;

  return (
    <div>
      <div className="mb-6 rounded-md border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">{plan.title}</h2>
            <p className="text-sm text-gray-500">
              {plan.startDate}
              {plan.endDate ? ` – ${plan.endDate}` : ""} · Hedef: {plan.targetCalories ?? "-"} kcal
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-900">Plan Toplamı</p>
            <TotalsBadge totals={plan.totals} />
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-end gap-2 rounded-md border border-gray-200 bg-gray-50 p-4">
        <div>
          <label className="block text-xs font-medium text-gray-600">Farklı kaloriye ayarla</label>
          <input
            type="number"
            min="1"
            value={newCalorieTarget}
            onChange={(event) => setNewCalorieTarget(event.target.value)}
            placeholder="örn. 1600"
            className="mt-1 w-32 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
          />
        </div>
        <button
          type="button"
          disabled={!newCalorieTarget || duplicateMutation.isLoading}
          onClick={() =>
            duplicateMutation.mutate({ dietPlanId: planId, newTargetCalories: Number(newCalorieTarget) })
          }
          className="rounded-md bg-gray-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-60"
        >
          {duplicateMutation.isLoading ? "Oluşturuluyor..." : "Yeni Plan Oluştur"}
        </button>
        {duplicateError && <p className="text-sm text-red-600">{duplicateError}</p>}
        {duplicateResultId && (
          <p className="text-sm text-brand-700">
            Yeni plan oluşturuldu (id: {duplicateResultId}) — bu sayfayı yeni plan için tekrar açabilirsiniz.
          </p>
        )}
      </div>

      {plan.days.map((day) => (
        <div key={day.id} className="mb-4 rounded-md border border-gray-200 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium">Gün {day.dayNumber}</h3>
            <TotalsBadge totals={day.totals} />
          </div>

          {day.meals.map((meal) => (
            <div key={meal.id} className="mb-3 rounded-md bg-gray-50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium">
                  {MEAL_TYPE_LABELS[meal.mealType]}
                  {meal.plannedTime ? ` · ${meal.plannedTime}` : ""}
                </p>
                <TotalsBadge totals={meal.totals} />
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                {meal.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.foodName} — {item.quantity} {item.unit}
                    </span>
                    <span className="text-gray-400">{item.calories} kcal</span>
                  </li>
                ))}
              </ul>
              <MealItemAdder mealId={meal.id} onAdded={refetchPlan} />
            </div>
          ))}

          {pendingMealDayId === day.id ? (
            <div className="flex items-center gap-2">
              <select
                value={pendingMealType}
                onChange={(event) => setPendingMealType(event.target.value as MealType)}
                className="rounded-md border border-gray-300 px-2 py-1 text-sm"
              >
                {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => {
                  addMealMutation.mutate({ dietPlanDayId: day.id, mealType: pendingMealType });
                  setPendingMealDayId(null);
                }}
                data-testid="confirm-add-meal-button"
                className="rounded-md bg-brand-600 px-3 py-1 text-sm text-white hover:bg-brand-700"
              >
                Ekle
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPendingMealDayId(day.id)}
              data-testid="add-meal-button"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              + Öğün Ekle
            </button>
          )}
        </div>
      ))}

      <button
        type="button"
        disabled={addDayMutation.isLoading}
        onClick={() => addDayMutation.mutate({ dietPlanId: planId, dayNumber: plan.days.length + 1 })}
        data-testid="add-day-button"
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
      >
        + Gün Ekle
      </button>
    </div>
  );
}
