import type { DietitianProfile as DietitianProfileRow, User } from "@fit-sihirbaz/db";
import type { ClientSummary, DietitianProfile, DietitianPublicSummary } from "@fit-sihirbaz/shared";

type DietitianProfileWithUser = DietitianProfileRow & { user: User };

export function toDietitianPublicSummary(row: DietitianProfileWithUser): DietitianPublicSummary {
  return {
    id: row.id,
    userId: row.userId,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    avatarUrl: row.user.avatarUrl,
    title: row.title,
    bio: row.bio,
    specialties: row.specialties,
    yearsOfExperience: row.yearsOfExperience,
    averageRating: row.averageRating === null ? null : Number(row.averageRating),
    verificationStatus: row.verificationStatus,
  };
}

export function toDietitianProfile(row: DietitianProfileWithUser): DietitianProfile {
  return {
    ...toDietitianPublicSummary(row),
    email: row.user.email,
    phone: row.user.phone,
    licenseNumber: row.licenseNumber,
    certificationUrls: row.certificationUrls,
  };
}

interface ClientDietitianLinkWithClientUser {
  status: "ACTIVE" | "ENDED";
  source: "MARKETPLACE" | "MANUAL_ADD";
  startedAt: Date;
  client: {
    id: string;
    userId: string;
    user: User;
  };
}

export function toClientSummary(link: ClientDietitianLinkWithClientUser): ClientSummary {
  return {
    id: link.client.id,
    userId: link.client.userId,
    firstName: link.client.user.firstName,
    lastName: link.client.user.lastName,
    email: link.client.user.email,
    avatarUrl: link.client.user.avatarUrl,
    linkStatus: link.status,
    linkSource: link.source,
    linkedAt: link.startedAt.toISOString(),
  };
}
