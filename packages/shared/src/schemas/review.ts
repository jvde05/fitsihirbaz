import { z } from "zod";
import { optionalCoerced } from "./common";

export const ReviewSchema = z.object({
  id: z.string().uuid(),
  clientId: z.string().uuid(),
  dietitianId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable(),
  clientFirstName: z.string(),
  clientLastName: z.string(),
  createdAt: z.string(),
});
export type Review = z.infer<typeof ReviewSchema>;

// clientId çıkarımı ctx.user'dan yapılır; danışan kendi yorumunu güncelliyorsa upsert edilir.
export const CreateReviewInputSchema = z.object({
  dietitianId: z.string().uuid(),
  rating: z.coerce.number().int().min(1, "En az 1 yıldız").max(5, "En fazla 5 yıldız"),
  comment: optionalCoerced(z.string().max(2000)),
});
export type CreateReviewInput = z.infer<typeof CreateReviewInputSchema>;

export const ListReviewsInputSchema = z.object({
  dietitianId: z.string().uuid(),
});
export type ListReviewsInput = z.infer<typeof ListReviewsInputSchema>;
