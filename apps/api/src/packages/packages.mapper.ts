import type { DietitianProfile, Package as PackageRow, User } from "@fit-sihirbaz/db";
import type { Package, PackageWithDietitian } from "@fit-sihirbaz/shared";

export function toPackage(row: PackageRow): Package {
  return {
    id: row.id,
    dietitianId: row.dietitianId,
    title: row.title,
    description: row.description,
    durationDays: row.durationDays,
    sessionCount: row.sessionCount,
    price: Number(row.price),
    currency: row.currency,
    isActive: row.isActive,
  };
}

type PackageWithDietitianRow = PackageRow & { dietitian: DietitianProfile & { user: User } };

export function toPackageWithDietitian(row: PackageWithDietitianRow): PackageWithDietitian {
  return {
    ...toPackage(row),
    dietitianFirstName: row.dietitian.user.firstName,
    dietitianLastName: row.dietitian.user.lastName,
    dietitianTitle: row.dietitian.title,
    dietitianAvatarUrl: row.dietitian.user.avatarUrl,
  };
}
