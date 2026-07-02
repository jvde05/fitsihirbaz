import { LoginInputSchema, RegisterInputSchema } from "./auth";

describe("RegisterInputSchema", () => {
  const validInput = {
    email: "test@example.com",
    password: "Sifre123",
    role: "CLIENT" as const,
    firstName: "Ada",
    lastName: "Lovelace",
  };

  it("geçerli bir kayıt girdisini kabul eder", () => {
    expect(RegisterInputSchema.safeParse(validInput).success).toBe(true);
  });

  it("geçersiz e-postayı reddeder", () => {
    const result = RegisterInputSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("sadece rakamlardan oluşan şifreyi reddeder", () => {
    const result = RegisterInputSchema.safeParse({
      ...validInput,
      password: "12345678",
    });
    expect(result.success).toBe(false);
  });

  it("8 karakterden kısa şifreyi reddeder", () => {
    const result = RegisterInputSchema.safeParse({
      ...validInput,
      password: "Ab1",
    });
    expect(result.success).toBe(false);
  });

  it("ADMIN rolüyle kayıt girdisini reddeder", () => {
    const result = RegisterInputSchema.safeParse({
      ...validInput,
      role: "ADMIN",
    });
    expect(result.success).toBe(false);
  });

  it("boş string telefon değerini (doldurulmamış form alanı) kabul eder", () => {
    const result = RegisterInputSchema.safeParse({ ...validInput, phone: "" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBeUndefined();
    }
  });
});

describe("LoginInputSchema", () => {
  it("geçerli bir giriş girdisini kabul eder", () => {
    const result = LoginInputSchema.safeParse({
      email: "test@example.com",
      password: "anything",
    });
    expect(result.success).toBe(true);
  });

  it("boş şifreyi reddeder", () => {
    const result = LoginInputSchema.safeParse({
      email: "test@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });
});
