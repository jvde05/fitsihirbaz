import type { User } from "@fit-sihirbaz/db";
import type { AdminUserSummary } from "@fit-sihirbaz/shared";

export function toAdminUserSummary(user: User): AdminUserSummary {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    isActive: user.isActive,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt.toISOString(),
  };
}
