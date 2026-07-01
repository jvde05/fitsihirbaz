import type { ProgressLog as ProgressLogRow } from "@fit-sihirbaz/db";
import type { ProgressLog } from "@fit-sihirbaz/shared";

function toNullableNumber(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

export function toProgressLog(row: ProgressLogRow): ProgressLog {
  return {
    id: row.id,
    clientId: row.clientId,
    logDate: row.logDate.toISOString().slice(0, 10),
    weightKg: toNullableNumber(row.weightKg),
    bodyFatPercent: toNullableNumber(row.bodyFatPercent),
    waistCm: toNullableNumber(row.waistCm),
    hipCm: toNullableNumber(row.hipCm),
    photoUrls: row.photoUrls,
    notes: row.notes,
  };
}
