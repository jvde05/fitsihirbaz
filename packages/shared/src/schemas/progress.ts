import { z } from "zod";
import { optionalCoerced } from "./common";

export const ProgressLogSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  logDate: z.string(),
  weightKg: z.number().nullable(),
  bodyFatPercent: z.number().nullable(),
  waistCm: z.number().nullable(),
  hipCm: z.number().nullable(),
  photoUrls: z.array(z.string()),
  notes: z.string().nullable(),
});
export type ProgressLog = z.infer<typeof ProgressLogSchema>;

export const AddProgressLogInputSchema = z.object({
  logDate: z.string().date("YYYY-MM-DD formatında olmalı"),
  weightKg: optionalCoerced(z.coerce.number().positive()),
  bodyFatPercent: optionalCoerced(z.coerce.number().min(0).max(100)),
  waistCm: optionalCoerced(z.coerce.number().positive()),
  hipCm: optionalCoerced(z.coerce.number().positive()),
  // Yüklenen dosya sunucumuzdan relatif bir yolla (/uploads/posts/...) servis edildiği için
  // .url() yerine düz string.
  photoUrls: z.array(z.string().min(1)).max(10).optional(),
  notes: z.string().max(2000).optional(),
});
export type AddProgressLogInput = z.infer<typeof AddProgressLogInputSchema>;

// CLIENT kendi geçmişini listeler (clientId yok sayılır); DIETITIAN kendisine
// bağlı bir danışanın geçmişini listeler (clientId zorunlu).
export const ListProgressLogsInputSchema = z.object({
  clientId: z.string().uuid().optional(),
});
export type ListProgressLogsInput = z.infer<typeof ListProgressLogsInputSchema>;
