import { CreatePostCommentInputSchema, CreatePostInputSchema } from "./post";

describe("CreatePostInputSchema", () => {
  it("geçerli bir paylaşım girdisini kabul eder", () => {
    expect(CreatePostInputSchema.safeParse({ content: "Merhaba akış!" }).success).toBe(true);
  });

  it("boş içeriği reddeder", () => {
    expect(CreatePostInputSchema.safeParse({ content: "" }).success).toBe(false);
  });

  it("boş imageUrl'i (doldurulmamış form alanı) undefined'a çevirir", () => {
    const result = CreatePostInputSchema.safeParse({ content: "Merhaba", imageUrl: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.imageUrl).toBeUndefined();
    }
  });
});

describe("CreatePostCommentInputSchema", () => {
  const validInput = { postId: "123e4567-e89b-12d3-a456-426614174000", content: "Harika!" };

  it("geçerli bir yorum girdisini kabul eder", () => {
    expect(CreatePostCommentInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("boş yorumu reddeder", () => {
    expect(CreatePostCommentInputSchema.safeParse({ ...validInput, content: "" }).success).toBe(false);
  });
});
