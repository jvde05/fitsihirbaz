import { z } from "zod";
import { optionalCoerced } from "./common";

export const VerificationStatusSchema = z.enum(["PENDING", "VERIFIED", "REJECTED"]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const DietitianPublicSummarySchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  avatarUrl: z.string().nullable(),
  title: z.string().nullable(),
  bio: z.string().nullable(),
  specialties: z.array(z.string()),
  yearsOfExperience: z.number().int().nullable(),
  averageRating: z.number().nullable(),
  verificationStatus: VerificationStatusSchema,
});
export type DietitianPublicSummary = z.infer<typeof DietitianPublicSummarySchema>;

// Diyetisyenin kendi profilini görüntülerken/düzenlerken kullandığı, iletişim bilgilerini de içeren şema.
export const DietitianProfileSchema = DietitianPublicSummarySchema.extend({
  email: z.string().email(),
  phone: z.string().nullable(),
  licenseNumber: z.string().nullable(),
  certificationUrls: z.array(z.string()),
});
export type DietitianProfile = z.infer<typeof DietitianProfileSchema>;

export const DietitianSearchInputSchema = z.object({
  query: z.string().min(1).max(100).optional(),
  specialty: z.string().min(1).max(100).optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type DietitianSearchInput = z.infer<typeof DietitianSearchInputSchema>;

export const DietitianSearchResultSchema = z.object({
  items: z.array(DietitianPublicSummarySchema),
  total: z.number().int(),
});
export type DietitianSearchResult = z.infer<typeof DietitianSearchResultSchema>;

export const UpdateDietitianProfileInputSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  bio: z.string().min(1).max(2000).optional(),
  specialties: z.array(z.string().min(1).max(50)).max(20).optional(),
  yearsOfExperience: optionalCoerced(z.coerce.number().int().min(0).max(70)),
  licenseNumber: z.string().min(1).max(50).optional(),
});
export type UpdateDietitianProfileInput = z.infer<typeof UpdateDietitianProfileInputSchema>;

// Admin: diyetisyen doğrulama kuyruğu.
export const AdminListDietitiansInputSchema = z.object({
  status: VerificationStatusSchema.optional(),
});
export type AdminListDietitiansInput = z.infer<typeof AdminListDietitiansInputSchema>;

export const AdminVerifyDietitianInputSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["VERIFIED", "REJECTED"]),
});
export type AdminVerifyDietitianInput = z.infer<typeof AdminVerifyDietitianInputSchema>;
