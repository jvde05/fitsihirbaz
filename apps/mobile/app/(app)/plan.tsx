import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { MEAL_TYPE_LABELS, type NutrientTotals } from "@fit-sihirbaz/shared";
import { trpc } from "@/lib/trpc";

function TotalsBadge({ totals }: { totals: NutrientTotals }) {
  return (
    <Text style={styles.totals}>
      {totals.calories} kcal · P {totals.protein}g · K {totals.carbs}g · Y {totals.fat}g
    </Text>
  );
}

export default function PlanScreen() {
  const plansQuery = trpc.dietPlans.list.useQuery({});
  const activePlanId = plansQuery.data?.[0]?.id;
  const planQuery = trpc.dietPlans.getById.useQuery({ id: activePlanId ?? "" }, { enabled: !!activePlanId });

  if (plansQuery.isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!activePlanId) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Henüz bir diyet planınız bulunmuyor.</Text>
      </View>
    );
  }

  if (planQuery.isLoading || !planQuery.data) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const plan = planQuery.data;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <Text style={styles.planTitle}>{plan.title}</Text>
        <Text style={styles.planMeta}>
          {plan.startDate}
          {plan.endDate ? ` – ${plan.endDate}` : ""} · Hedef: {plan.targetCalories ?? "-"} kcal
        </Text>
        <Text style={styles.planTotalsLabel}>Plan Toplamı</Text>
        <TotalsBadge totals={plan.totals} />
      </View>

      {plan.days.map((day) => (
        <View key={day.id} style={styles.dayCard}>
          <View style={styles.rowBetween}>
            <Text style={styles.dayTitle}>Gün {day.dayNumber}</Text>
            <TotalsBadge totals={day.totals} />
          </View>

          {day.meals.map((meal) => (
            <View key={meal.id} style={styles.mealCard}>
              <View style={styles.rowBetween}>
                <Text style={styles.mealTitle}>
                  {MEAL_TYPE_LABELS[meal.mealType]}
                  {meal.plannedTime ? ` · ${meal.plannedTime}` : ""}
                </Text>
                <TotalsBadge totals={meal.totals} />
              </View>
              {meal.items.map((item) => (
                <View key={item.id} style={styles.rowBetween}>
                  <Text style={styles.itemText}>
                    {item.itemName} — {item.quantity} {item.unit}
                  </Text>
                  <Text style={styles.itemCalories}>{item.calories} kcal</Text>
                </View>
              ))}
              {meal.items.length === 0 && <Text style={styles.emptyText}>Bu öğüne henüz besin eklenmedi.</Text>}
            </View>
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { color: "#9ca3af", fontSize: 14 },
  card: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16 },
  planTitle: { fontSize: 18, fontWeight: "600" },
  planMeta: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  planTotalsLabel: { fontSize: 13, fontWeight: "500", marginTop: 12 },
  totals: { fontSize: 12, color: "#6b7280" },
  dayCard: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 16, gap: 8 },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  dayTitle: { fontWeight: "500" },
  mealCard: { backgroundColor: "#f9fafb", borderRadius: 8, padding: 12, gap: 4 },
  mealTitle: { fontSize: 13, fontWeight: "500" },
  itemText: { fontSize: 13, color: "#374151" },
  itemCalories: { fontSize: 13, color: "#9ca3af" },
});
