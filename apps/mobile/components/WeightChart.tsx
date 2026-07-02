import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import type { ProgressLog } from "@fit-sihirbaz/shared";

const CHART_HEIGHT = 160;
const CHART_WIDTH = 320;
const PADDING = 24;

export function WeightChart({ logs }: { logs: ProgressLog[] }) {
  const points = logs
    .filter((log): log is ProgressLog & { weightKg: number } => log.weightKg !== null)
    .map((log) => ({ date: log.logDate, weight: log.weightKg }));

  if (points.length < 2) {
    return (
      <Text style={styles.emptyText}>
        Grafik için en az 2 kilo ölçümü gerekiyor ({points.length}/2 kayıtlı).
      </Text>
    );
  }

  const weights = points.map((p) => p.weight);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);
  const weightRange = maxWeight - minWeight || 1;

  const innerWidth = CHART_WIDTH - PADDING * 2;
  const innerHeight = CHART_HEIGHT - PADDING * 2;

  function xFor(index: number): number {
    return PADDING + (index / (points.length - 1)) * innerWidth;
  }
  function yFor(weight: number): number {
    return PADDING + innerHeight - ((weight - minWeight) / weightRange) * innerHeight;
  }

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(p.weight)}`).join(" ");

  return (
    <View style={styles.container} testID="weight-chart">
      <Svg width="100%" height={CHART_HEIGHT} viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}>
        <Path d={pathD} fill="none" stroke="#059669" strokeWidth={2} />
        {points.map((p, i) => (
          <Circle key={p.date} cx={xFor(i)} cy={yFor(p.weight)} r={3} fill="#059669" />
        ))}
      </Svg>
      <View style={styles.labelRow}>
        <Text style={styles.labelText}>
          {points[0].date} · {minWeight}–{maxWeight} kg
        </Text>
        <Text style={styles.labelText}>{points[points.length - 1].date}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, padding: 12 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  labelText: { fontSize: 11, color: "#9ca3af" },
  emptyText: { fontSize: 13, color: "#9ca3af" },
});
