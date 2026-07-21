import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.validation";

export interface MailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface MailProvider {
  send(message: MailMessage): Promise<void>;
}

export const MAIL_PROVIDER = Symbol("MAIL_PROVIDER");

// Gerçek Resend API'sine `fetch` ile istek atar. RESEND_API_KEY doluysa mail.module.ts
// bu implementasyonu bağlar; boşsa ConsoleMailProvider devreye girer.
@Injectable()
export class ResendMailProvider implements MailProvider {
  constructor(private readonly config: ConfigService<Env, true>) {}

  async send(message: MailMessage): Promise<void> {
    const apiKey = this.config.getOrThrow("RESEND_API_KEY", { infer: true });
    const from = this.config.get("MAIL_FROM", { infer: true });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: message.to,
        subject: message.subject,
        html: message.html,
        text: message.text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend e-posta gönderimi başarısız (${response.status}): ${body}`);
    }
  }
}

// RESEND_API_KEY yokken (dev ortamı) e-postayı gerçekten göndermek yerine konsola loglar;
// böylece şifre sıfırlama/e-posta doğrulama linkleri geliştirici tarafından kopyalanabilir.
@Injectable()
export class ConsoleMailProvider implements MailProvider {
  private readonly logger = new Logger("MailDev");

  async send(message: MailMessage): Promise<void> {
    this.logger.log(
      `[MAIL:DEV] Kime: ${message.to} | Konu: ${message.subject}\n${message.text}`,
    );
  }
}
