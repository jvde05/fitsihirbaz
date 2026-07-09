"use client";

import type { ProgressLog } from "@fit-sihirbaz/shared";

const CHART_HEIGHT = 160;
const CHART_WIDTH = 600;
const PADDING = 24;

interface WeightChartProps {
  logs: ProgressLog[];
}

export function WeightChart({ logs }: WeightChartProps) {
  const points = logs
    .filter((log): log is ProgressLog & { weightKg: number } => log.weightKg !== null)
    .map((log) => ({ date: log.logDate, weight: log.weightKg }));

  if (points.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        Grafik için en az 2 kilo ölçümü gerekiyor ({points.length}/2 kayıtlı).
      </p>
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
    <div className="rounded-md border p-4">
      <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full" role="img" aria-label="Kilo değişim grafiği">
        <text x={PADDING} y={PADDING - 8} className="fill-muted-foreground text-[10px]">
          {maxWeight} kg
        </text>
        <text x={PADDING} y={CHART_HEIGHT - PADDING + 14} className="fill-muted-foreground text-[10px]">
          {minWeight} kg
        </text>
        <path d={pathD} fill="none" stroke="hsl(var(--primary))" strokeWidth={2} />
        {points.map((p, i) => (
          <circle key={p.date} cx={xFor(i)} cy={yFor(p.weight)} r={3} fill="hsl(var(--primary))" />
        ))}
        <text x={xFor(0)} y={CHART_HEIGHT - 4} className="fill-muted-foreground/70 text-[10px]">
          {points[0].date}
        </text>
        <text x={xFor(points.length - 1)} y={CHART_HEIGHT - 4} textAnchor="end" className="fill-muted-foreground/70 text-[10px]">
          {points[points.length - 1].date}
        </text>
      </svg>
    </div>
  );
}
