import type { ReferenceIntake as ReferenceIntakeRow } from "@fit-sihirbaz/db";
import type { ReferenceIntake } from "@fit-sihirbaz/shared";

export function toReferenceIntake(row: ReferenceIntakeRow): ReferenceIntake {
  return {
    id: row.id,
    nutrient: row.nutrient,
    unit: row.unit,
    ageMinYears: row.ageMinYears,
    ageMaxYears: row.ageMaxYears,
    sex: row.sex,
    lifeStage: row.lifeStage,
    value: Number(row.value),
    sourceLabel: row.sourceLabel,
    isVerifiedSource: row.isVerifiedSource,
    notes: row.notes,
  };
}
