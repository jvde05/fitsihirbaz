"use client";

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import type { MealType } from "@fit-sihirbaz/shared";
import { MealItemAdder } from "./MealItemAdder";
import { MEAL_TYPE_LABELS, TotalsBadge } from "./diet-plan-ui";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
    return <p className="text-muted-foreground">Plan yükleniyor...</p>;
  }
  const plan = planQuery.data;

  return (
    <div>
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">{plan.title}</h2>
            <p className="text-sm text-muted-foreground">
              {plan.startDate}
              {plan.endDate ? ` – ${plan.endDate}` : ""} · Hedef: {plan.targetCalories ?? "-"} kcal
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">Plan Toplamı</p>
            <TotalsBadge totals={plan.totals} />
          </div>
        </div>
      </Card>

      <Card className="mb-6 flex flex-wrap items-end gap-2 bg-muted/30 p-4">
        <div className="space-y-1">
          <Label className="text-xs">Farklı kaloriye ayarla</Label>
          <Input
            type="number"
            min="1"
            value={newCalorieTarget}
            onChange={(event) => setNewCalorieTarget(event.target.value)}
            placeholder="örn. 1600"
            className="w-32"
          />
        </div>
        <Button
          variant="secondary"
          disabled={!newCalorieTarget || duplicateMutation.isLoading}
          onClick={() =>
            duplicateMutation.mutate({ dietPlanId: planId, newTargetCalories: Number(newCalorieTarget) })
          }
        >
          {duplicateMutation.isLoading ? "Oluşturuluyor..." : "Yeni Plan Oluştur"}
        </Button>
        {duplicateError && <p className="text-sm text-destructive">{duplicateError}</p>}
        {duplicateResultId && (
          <p className="text-sm text-primary">
            Yeni plan oluşturuldu (id: {duplicateResultId}) — bu sayfayı yeni plan için tekrar açabilirsiniz.
          </p>
        )}
      </Card>

      {plan.days.map((day) => (
        <Card key={day.id} className="mb-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-medium text-foreground">Gün {day.dayNumber}</h3>
            <TotalsBadge totals={day.totals} />
          </div>

          {day.meals.map((meal) => (
            <div key={meal.id} className="mb-3 rounded-md bg-muted/50 p-3">
              <div className="mb-1 flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">
                  {MEAL_TYPE_LABELS[meal.mealType]}
                  {meal.plannedTime ? ` · ${meal.plannedTime}` : ""}
                </p>
                <TotalsBadge totals={meal.totals} />
              </div>
              <ul className="space-y-1 text-sm text-foreground/90">
                {meal.items.map((item) => (
                  <li key={item.id} className="flex justify-between">
                    <span>
                      {item.itemName} — {item.quantity} {item.unit}
                    </span>
                    <span className="text-muted-foreground">{item.calories} kcal</span>
                  </li>
                ))}
              </ul>
              <MealItemAdder mealId={meal.id} onAdded={refetchPlan} />
            </div>
          ))}

          {pendingMealDayId === day.id ? (
            <div className="flex items-center gap-2">
              <Select value={pendingMealType} onValueChange={(value) => setPendingMealType(value as MealType)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEAL_TYPE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="sm"
                data-testid="confirm-add-meal-button"
                onClick={() => {
                  addMealMutation.mutate({ dietPlanDayId: day.id, mealType: pendingMealType });
                  setPendingMealDayId(null);
                }}
              >
                Ekle
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPendingMealDayId(day.id)}
              data-testid="add-meal-button"
              className="text-sm font-medium text-primary hover:underline"
            >
              + Öğün Ekle
            </button>
          )}
        </Card>
      ))}

      <Button
        variant="outline"
        disabled={addDayMutation.isLoading}
        data-testid="add-day-button"
        onClick={() => addDayMutation.mutate({ dietPlanId: planId, dayNumber: plan.days.length + 1 })}
      >
        + Gün Ekle
      </Button>
    </div>
  );
}
