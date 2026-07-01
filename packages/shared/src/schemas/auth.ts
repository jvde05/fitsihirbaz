import { z } from "zod";
import { PublicUserSchema, RegistrableRoleSchema } from "./user";

// Şifre kuralları: en az 8 karakter, en az 1 harf + 1 rakam. bcrypt 72 byte sınırı için üst sınır konur.
const passwordSchema = z
  .string()
  .min(8, "Şifre en az 8 karakter olmalı")
  .max(72, "Şifre en fazla 72 karakter olabilir")
  .regex(/[A-Za-z]/, "Şifre en az bir harf içermeli")
  .regex(/[0-9]/, "Şifre en az bir rakam içermeli");

export const RegisterInputSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: passwordSchema,
  role: RegistrableRoleSchema,
  firstName: z.string().min(1, "Ad zorunlu").max(100),
  lastName: z.string().min(1, "Soyad zorunlu").max(100),
  phone: z
    .string()
    .min(7)
    .max(20)
    .regex(/^\+?[0-9 ]+$/, "Geçerli bir telefon numarası girin")
    .optional(),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const LoginInputSchema = z.object({
  email: z.string().email("Geçerli bir e-posta girin"),
  password: z.string().min(1, "Şifre zorunlu"),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

// Web: refresh token httpOnly cookie'den okunur, body boş olabilir.
// Mobil: refresh token secure storage'dan alınıp body'de gönderilir.
export const RefreshInputSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshInput = z.infer<typeof RefreshInputSchema>;

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type AuthTokens = z.infer<typeof AuthTokensSchema>;

export const AuthResponseSchema = z.object({
  user: PublicUserSchema,
  tokens: AuthTokensSchema,
});
export type AuthResponse = z.infer<typeof AuthResponseSchema>;

export const MeResponseSchema = PublicUserSchema;
export type MeResponse = z.infer<typeof MeResponseSchema>;
