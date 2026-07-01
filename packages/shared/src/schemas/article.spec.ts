import { CreateArticleInputSchema } from "./article";

describe("CreateArticleInputSchema", () => {
  const validInput = {
    title: "Protein İhtiyacı Nasıl Hesaplanır?",
    slug: "protein-ihtiyaci-nasil-hesaplanir",
    body: "İçerik metni...",
  };

  it("geçerli girdiyi kabul eder", () => {
    expect(CreateArticleInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("büyük harf içeren slug'ı reddeder", () => {
    expect(CreateArticleInputSchema.safeParse({ ...validInput, slug: "Protein-Ihtiyaci" }).success).toBe(false);
  });

  it("Türkçe karakter içeren slug'ı reddeder", () => {
    expect(CreateArticleInputSchema.safeParse({ ...validInput, slug: "protein-ihtiyacı" }).success).toBe(false);
  });

  it("boş içeriği reddeder", () => {
    expect(CreateArticleInputSchema.safeParse({ ...validInput, body: "" }).success).toBe(false);
  });
});
