import { z } from "zod";

export const RoleSchema = z.enum(["CLIENT", "DIETITIAN", "ADMIN"]);
export type Role = z.infer<typeof RoleSchema>;

// Kayıt sırasında seçilebilecek roller — ADMIN sadece db/manuel olarak atanır.
export const RegistrableRoleSchema = z.enum(["CLIENT", "DIETITIAN"]);
export type RegistrableRole = z.infer<typeof RegistrableRoleSchema>;

export const PublicUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  firstName: z.string(),
  lastName: z.string(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().url().nullable().optional(),
  isEmailVerified: z.boolean(),
});
export type PublicUser = z.infer<typeof PublicUserSchema>;

// Form input'larında boş bırakılan opsiyonel alanlar "" olarak gelir (undefined değil);
// preprocess ile "" -> undefined çevrilir ki .min(7) gibi kurallar boş değeri reddetmesin.
export const optionalPhoneSchema = z.preprocess(
  (value) => (value === "" ? undefined : value),
  z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9 ]+$/, "Geçerli bir telefon numarası girin")
    .optional(),
);

export const UpdateProfileInputSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: optionalPhoneSchema,
  avatarUrl: z.string().url().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
