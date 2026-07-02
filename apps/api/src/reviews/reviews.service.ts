import { Injectable } from "@nestjs/common";
import type { CreateReviewInput, Review } from "@fit-sihirbaz/shared";
import { PrismaService } from "../prisma/prisma.service";
import { ClientProfileNotFoundError, NoPaidOrderError } from "./reviews.errors";
import { toReview } from "./reviews.mapper";

const REVIEW_INCLUDE = { client: { include: { user: true } } } as const;

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(clientUserId: string, input: CreateReviewInput): Promise<Review> {
    const clientProfile = await this.prisma.clientProfile.findUnique({ where: { userId: clientUserId } });
    if (!clientProfile) {
      throw new ClientProfileNotFoundError();
    }

    const paidOrder = await this.prisma.order.findFirst({
      where: { clientId: clientProfile.id, dietitianId: input.dietitianId, status: "PAID" },
    });
    if (!paidOrder) {
      throw new NoPaidOrderError();
    }

    const review = await this.prisma.review.upsert({
      where: { clientId_dietitianId: { clientId: clientProfile.id, dietitianId: input.dietitianId } },
      create: {
        clientId: clientProfile.id,
        dietitianId: input.dietitianId,
        rating: input.rating,
        comment: input.comment ?? null,
      },
      update: {
        rating: input.rating,
        comment: input.comment ?? null,
      },
      include: REVIEW_INCLUDE,
    });

    await this.recalculateAverageRating(input.dietitianId);

    return toReview(review);
  }

  async listForDietitian(dietitianId: string): Promise<Review[]> {
    const reviews = await this.prisma.review.findMany({
      where: { dietitianId },
      include: REVIEW_INCLUDE,
      orderBy: { createdAt: "desc" },
    });
    return reviews.map(toReview);
  }

  private async recalculateAverageRating(dietitianId: string): Promise<void> {
    const aggregate = await this.prisma.review.aggregate({
      where: { dietitianId },
      _avg: { rating: true },
    });
    await this.prisma.dietitianProfile.update({
      where: { id: dietitianId },
      data: { averageRating: aggregate._avg.rating ?? null },
    });
  }
}
