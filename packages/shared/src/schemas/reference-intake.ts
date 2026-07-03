import { z } from "zod";
import { optionalCoerced } from "./common";

export const ReferenceSexSchema = z.enum(["MALE", "FEMALE", "ALL"]);
export type ReferenceSex = z.infer<typeof ReferenceSexSchema>;

export const ReferenceLifeStageSchema = z.enum(["NONE", "PREGNANCY", "LACTATION"]);
export type ReferenceLifeStage = z.infer<typeof ReferenceLifeStageSchema>;

// isVerifiedSource=false: resmi TÜBER kaynağıyla henüz teyit edilmemiş, yer tutucu değer —
// arayüzde bu bilgi açıkça gösterilmeli, kesin klinik değermiş gibi sunulmamalı.
export const ReferenceIntakeSchema = z.object({
  id: z.string().uuid(),
  nutrient: z.string(),
  unit: z.string(),
  ageMinYears: z.number().int(),
  ageMaxYears: z.number().int().nullable(),
  sex: ReferenceSexSchema,
  lifeStage: ReferenceLifeStageSchema,
  value: z.number(),
  sourceLabel: z.string(),
  isVerifiedSource: z.boolean(),
  notes: z.string().nullable(),
});
export type ReferenceIntake = z.infer<typeof ReferenceIntakeSchema>;

export const ListReferenceIntakesInputSchema = z.object({
  nutrient: z.string().min(1).max(100).optional(),
});
export type ListReferenceIntakesInput = z.infer<typeof ListReferenceIntakesInputSchema>;

export const FindReferenceIntakesForProfileInputSchema = z.object({
  ageYears: z.coerce.number().int().min(0).max(120),
  sex: z.enum(["MALE", "FEMALE"]),
  lifeStage: ReferenceLifeStageSchema.default("NONE"),
});
export type FindReferenceIntakesForProfileInput = z.infer<typeof FindReferenceIntakesForProfileInputSchema>;

export const UpsertReferenceIntakeInputSchema = z.object({
  id: z.string().uuid().optional(),
  nutrient: z.string().min(1, "Besin öğesi zorunlu").max(100),
  unit: z.string().min(1, "Birim zorunlu").max(20),
  ageMinYears: z.coerce.number().int().min(0).max(120),
  ageMaxYears: optionalCoerced(z.coerce.number().int().min(0).max(120)),
  sex: ReferenceSexSchema,
  lifeStage: ReferenceLifeStageSchema.default("NONE"),
  value: z.coerce.number().nonnegative(),
  sourceLabel: z.string().min(1, "Kaynak açıklaması zorunlu").max(300),
  isVerifiedSource: z.coerce.boolean().default(false),
  notes: optionalCoerced(z.string().max(1000)),
});
export type UpsertReferenceIntakeInput = z.infer<typeof UpsertReferenceIntakeInputSchema>;

export const DeleteReferenceIntakeInputSchema = z.object({
  id: z.string().uuid(),
});
export type DeleteReferenceIntakeInput = z.infer<typeof DeleteReferenceIntakeInputSchema>;
