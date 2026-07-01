import { z } from "zod";
import { optionalCoerced } from "./common";

export const PackageSchema = z.object({
  id: z.string().uuid(),
  dietitianId: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  durationDays: z.number().int(),
  sessionCount: z.number().int().nullable(),
  price: z.number(),
  currency: z.string(),
  isActive: z.boolean(),
});
export type Package = z.infer<typeof PackageSchema>;

export const PackageWithDietitianSchema = PackageSchema.extend({
  dietitianFirstName: z.string(),
  dietitianLastName: z.string(),
  dietitianTitle: z.string().nullable(),
  dietitianAvatarUrl: z.string().nullable(),
});
export type PackageWithDietitian = z.infer<typeof PackageWithDietitianSchema>;

export const CreatePackageInputSchema = z.object({
  title: z.string().min(1, "Başlık zorunlu").max(200),
  description: z.string().max(2000).optional(),
  durationDays: z.coerce.number().int().positive(),
  sessionCount: optionalCoerced(z.coerce.number().int().positive()),
  price: z.coerce.number().positive(),
  currency: z.string().min(3).max(3).default("TRY"),
});
export type CreatePackageInput = z.infer<typeof CreatePackageInputSchema>;

export const UpdatePackageInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  durationDays: optionalCoerced(z.coerce.number().int().positive()),
  sessionCount: optionalCoerced(z.coerce.number().int().positive()),
  price: optionalCoerced(z.coerce.number().positive()),
  isActive: z.boolean().optional(),
});
export type UpdatePackageInput = z.infer<typeof UpdatePackageInputSchema>;

// Danışan tarafı — pazaryerinde aktif paketleri filtreli listeler (herkese açık).
export const BrowsePackagesInputSchema = z.object({
  dietitianId: z.string().uuid().optional(),
  minPrice: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});
export type BrowsePackagesInput = z.infer<typeof BrowsePackagesInputSchema>;

export const BrowsePackagesResultSchema = z.object({
  items: z.array(PackageWithDietitianSchema),
  total: z.number().int(),
});
export type BrowsePackagesResult = z.infer<typeof BrowsePackagesResultSchema>;
