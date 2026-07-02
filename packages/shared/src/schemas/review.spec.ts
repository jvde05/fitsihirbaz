import { CreateReviewInputSchema } from "./review";

describe("CreateReviewInputSchema", () => {
  const validInput = { dietitianId: "123e4567-e89b-12d3-a456-426614174000", rating: 5 };

  it("geçerli bir yorum girdisini kabul eder", () => {
    expect(CreateReviewInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("1-5 aralığı dışındaki puanı reddeder", () => {
    expect(CreateReviewInputSchema.safeParse({ ...validInput, rating: 6 }).success).toBe(false);
    expect(CreateReviewInputSchema.safeParse({ ...validInput, rating: 0 }).success).toBe(false);
  });

  it("boş comment'i (doldurulmamış form alanı) undefined'a çevirir", () => {
    const result = CreateReviewInputSchema.safeParse({ ...validInput, comment: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.comment).toBeUndefined();
    }
  });
});
