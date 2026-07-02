import { MarkNotificationReadInputSchema, NotificationSchema } from "./notification";

describe("NotificationSchema", () => {
  it("herhangi bir payload şeklini kabul eder", () => {
    const result = NotificationSchema.safeParse({
      id: "123e4567-e89b-12d3-a456-426614174000",
      type: "NEW_MESSAGE",
      payload: { conversationId: "abc", preview: "Merhaba" },
      isRead: false,
      createdAt: "2026-07-01T00:00:00.000Z",
    });
    expect(result.success).toBe(true);
  });
});

describe("MarkNotificationReadInputSchema", () => {
  it("geçersiz uuid'yi reddeder", () => {
    expect(MarkNotificationReadInputSchema.safeParse({ id: "not-a-uuid" }).success).toBe(false);
  });
});
