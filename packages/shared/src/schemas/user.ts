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

// Admin: kullanıcı yönetimi.
export const AdminUserSummarySchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  role: RoleSchema,
  firstName: z.string(),
  lastName: z.string(),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  createdAt: z.string(),
});
export type AdminUserSummary = z.infer<typeof AdminUserSummarySchema>;

export const AdminListUsersInputSchema = z.object({
  role: RoleSchema.optional(),
  query: z.string().min(1).max(100).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});
export type AdminListUsersInput = z.infer<typeof AdminListUsersInputSchema>;

export const AdminListUsersResultSchema = z.object({
  items: z.array(AdminUserSummarySchema),
  total: z.number().int(),
});
export type AdminListUsersResult = z.infer<typeof AdminListUsersResultSchema>;

export const AdminSetUserActiveInputSchema = z.object({
  id: z.string().uuid(),
  isActive: z.boolean(),
});
export type AdminSetUserActiveInput = z.infer<typeof AdminSetUserActiveInputSchema>;
