import { SendMessageInputSchema } from "./message";

describe("SendMessageInputSchema", () => {
  it("geçerli mesajı kabul eder", () => {
    const result = SendMessageInputSchema.safeParse({
      conversationId: "123e4567-e89b-12d3-a456-426614174000",
      content: "Merhaba!",
    });
    expect(result.success).toBe(true);
  });

  it("boş mesajı reddeder", () => {
    const result = SendMessageInputSchema.safeParse({
      conversationId: "123e4567-e89b-12d3-a456-426614174000",
      content: "",
    });
    expect(result.success).toBe(false);
  });

  it("5000 karakterden uzun mesajı reddeder", () => {
    const result = SendMessageInputSchema.safeParse({
      conversationId: "123e4567-e89b-12d3-a456-426614174000",
      content: "a".repeat(5001),
    });
    expect(result.success).toBe(false);
  });
});
