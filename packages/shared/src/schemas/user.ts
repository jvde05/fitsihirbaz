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

export const UpdateProfileInputSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9 ]+$/, "Geçerli bir telefon numarası girin")
    .optional(),
  avatarUrl: z.string().url().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileInputSchema>;
