import type { User } from "@fit-sihirbaz/db";
import type { PublicUser } from "@fit-sihirbaz/shared";

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    avatarUrl: user.avatarUrl,
    isEmailVerified: user.isEmailVerified,
  };
}
