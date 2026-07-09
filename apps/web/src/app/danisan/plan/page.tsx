"use client";

import { trpc } from "@/lib/trpc";
import { MEAL_TYPE_LABELS, TotalsBadge } from "@/components/diet-plans/diet-plan-ui";
import { QueryErrorNotice } from "@/components/QueryErrorNotice";
import { Card } from "@/components/ui/card";

export default function DanisanPlanPage() {
  const plansQuery = trpc.dietPlans.list.useQuery({});
  const activePlanId = plansQuery.data?.[0]?.id;
  const planQuery = trpc.dietPlans.getById.useQuery({ id: activePlanId ?? "" }, { enabled: !!activePlanId });

  if (plansQuery.isLoading) {
    return <p className="text-muted-foreground">Yükleniyor...</p>;
  }

  if (plansQuery.isError) {
    return <QueryErrorNotice message={plansQuery.error.message} onRetry={() => plansQuery.refetch()} />;
  }

  if (!activePlanId) {
    return <p className="text-muted-foreground">Henüz bir diyet planınız bulunmuyor.</p>;
  }

  if (planQuery.isError) {
    return <QueryErrorNotice message={planQuery.error.message} onRetry={() => planQuery.refetch()} />;
  }

  if (planQuery.isLoading || !planQuery.data) {
    return <p className="text-muted-foreground">Plan yükleniyor...</p>;
  }

  const plan = planQuery.data;

  return (
    <div>
      <Card className="mb-6 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-foreground">{plan.title}</h1>
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

      {plan.days.map((day) => (
        <Card key={day.id} className="mb-4 p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-medium text-foreground">Gün {day.dayNumber}</h2>
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
              {meal.items.length === 0 && <p className="text-sm text-muted-foreground">Bu öğüne henüz besin eklenmedi.</p>}
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}
