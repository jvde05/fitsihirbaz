import { CreateAppointmentInputSchema } from "./appointment";

describe("CreateAppointmentInputSchema", () => {
  const validInput = {
    dietitianId: "123e4567-e89b-12d3-a456-426614174000",
    scheduledAt: "2026-07-15T14:30",
  };

  it("geçerli tarih/saat girdisini kabul eder", () => {
    expect(CreateAppointmentInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("geçersiz tarih formatını reddeder", () => {
    expect(CreateAppointmentInputSchema.safeParse({ ...validInput, scheduledAt: "15/07/2026" }).success).toBe(
      false,
    );
  });

  it("boş string durationMinutes değerini (doldurulmamış form alanı) kabul eder", () => {
    const result = CreateAppointmentInputSchema.safeParse({ ...validInput, durationMinutes: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.durationMinutes).toBeUndefined();
    }
  });

  it("480 dakikadan uzun süreyi reddeder", () => {
    expect(CreateAppointmentInputSchema.safeParse({ ...validInput, durationMinutes: 600 }).success).toBe(false);
  });
});
