import type { MailMessage } from "./mail.provider";

export function passwordResetEmail(link: string): Omit<MailMessage, "to"> {
  return {
    subject: "Fit Sihirbaz — Şifre Sıfırlama",
    text: `Şifreni sıfırlamak için bu bağlantıya tıkla: ${link}\n\nBu isteği sen yapmadıysan bu e-postayı yok sayabilirsin. Bağlantı 60 dakika içinde geçerliliğini yitirir.`,
    html: `<p>Şifreni sıfırlamak için <a href="${link}">buraya tıkla</a>.</p><p>Bu isteği sen yapmadıysan bu e-postayı yok sayabilirsin. Bağlantı 60 dakika içinde geçerliliğini yitirir.</p>`,
  };
}

export function verificationEmail(link: string): Omit<MailMessage, "to"> {
  return {
    subject: "Fit Sihirbaz — E-posta Adresini Doğrula",
    text: `E-posta adresini doğrulamak için bu bağlantıya tıkla: ${link}\n\nBağlantı 24 saat içinde geçerliliğini yitirir.`,
    html: `<p>E-posta adresini doğrulamak için <a href="${link}">buraya tıkla</a>.</p><p>Bağlantı 24 saat içinde geçerliliğini yitirir.</p>`,
  };
}
