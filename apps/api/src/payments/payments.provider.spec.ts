import { MockPaymentProvider } from "./payments.provider";
import type { Payment } from "@fit-sihirbaz/db";
import type { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.validation";

describe("MockPaymentProvider", () => {
  it("checkoutUrl'i WEB_APP_URL + ödeme simülasyon rotasından oluşturur", async () => {
    const config = { get: (key: string) => (key === "WEB_APP_URL" ? "http://localhost:3000" : undefined) };
    const provider = new MockPaymentProvider(config as unknown as ConfigService<Env, true>);

    const payment = { id: "payment-1" } as Payment;
    const result = await provider.initiateCheckout(payment);

    expect(result.checkoutUrl).toBe("http://localhost:3000/danisan/odeme-simulasyon/payment-1");
    expect(result.providerTransactionId).toBe("mock_payment-1");
  });

  it("farklı bir WEB_APP_URL ile de doğru checkoutUrl üretir", async () => {
    const config = { get: (key: string) => (key === "WEB_APP_URL" ? "https://fitsihirbaz.com" : undefined) };
    const provider = new MockPaymentProvider(config as unknown as ConfigService<Env, true>);

    const payment = { id: "payment-2" } as Payment;
    const result = await provider.initiateCheckout(payment);

    expect(result.checkoutUrl).toBe("https://fitsihirbaz.com/danisan/odeme-simulasyon/payment-2");
  });
});
