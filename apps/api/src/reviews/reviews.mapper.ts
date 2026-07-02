import type { ClientProfile, Review as ReviewRow, User } from "@fit-sihirbaz/db";
import type { Review } from "@fit-sihirbaz/shared";

type ReviewWithClient = ReviewRow & { client: ClientProfile & { user: User } };

export function toReview(row: ReviewWithClient): Review {
  return {
    id: row.id,
    clientId: row.clientId,
    dietitianId: row.dietitianId,
    rating: row.rating,
    comment: row.comment,
    clientFirstName: row.client.user.firstName,
    clientLastName: row.client.user.lastName,
    createdAt: row.createdAt.toISOString(),
  };
}
