import { createHmac } from "node:crypto";
import { UnauthorizedException } from "@nestjs/common";
import { ZodError } from "zod";
import { PaymentsWebhookController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import type { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.validation";

const WEBHOOK_SECRET = "test-webhook-secret";

function sign(body: unknown): string {
  return createHmac("sha256", WEBHOOK_SECRET).update(JSON.stringify(body)).digest("hex");
}

describe("PaymentsWebhookController", () => {
  let paymentsService: { applyProviderResult: jest.Mock };
  let controller: PaymentsWebhookController;

  beforeEach(() => {
    paymentsService = { applyProviderResult: jest.fn() };
    const config = { get: (key: string) => (key === "PAYMENT_WEBHOOK_SECRET" ? WEBHOOK_SECRET : undefined) };
    controller = new PaymentsWebhookController(
      paymentsService as unknown as PaymentsService,
      config as unknown as ConfigService<Env, true>,
    );
  });

  it("imza eksikse UnauthorizedException fırlatır ve servisi çağırmaz", async () => {
    const body = { paymentId: "11111111-1111-1111-1111-111111111111", status: "SUCCESS" };
    await expect(controller.handleWebhook(body, undefined)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(paymentsService.applyProviderResult).not.toHaveBeenCalled();
  });

  it("imza yanlışsa UnauthorizedException fırlatır", async () => {
    const body = { paymentId: "11111111-1111-1111-1111-111111111111", status: "SUCCESS" };
    await expect(controller.handleWebhook(body, "yanlis-imza")).rejects.toBeInstanceOf(UnauthorizedException);
    expect(paymentsService.applyProviderResult).not.toHaveBeenCalled();
  });

  it("geçerli imza + geçersiz payload şemasında ZodError fırlatır", async () => {
    const body = { paymentId: "not-a-uuid", status: "SUCCESS" };
    const signature = sign(body);
    await expect(controller.handleWebhook(body, signature)).rejects.toBeInstanceOf(ZodError);
    expect(paymentsService.applyProviderResult).not.toHaveBeenCalled();
  });

  it("geçerli imza + geçerli payload ile applyProviderResult'ı çağırır ve received döner", async () => {
    const body = { paymentId: "11111111-1111-1111-1111-111111111111", status: "SUCCESS" };
    const signature = sign(body);

    const result = await controller.handleWebhook(body, signature);

    expect(paymentsService.applyProviderResult).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "SUCCESS",
    );
    expect(result).toEqual({ received: true });
  });

  it("FAILED durumunu da doğru şekilde iletir", async () => {
    const body = { paymentId: "22222222-2222-2222-2222-222222222222", status: "FAILED" };
    const signature = sign(body);

    await controller.handleWebhook(body, signature);

    expect(paymentsService.applyProviderResult).toHaveBeenCalledWith(
      "22222222-2222-2222-2222-222222222222",
      "FAILED",
    );
  });
});
