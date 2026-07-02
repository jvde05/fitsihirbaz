import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import type { Env } from "../config/env.validation";

export const APPOINTMENT_REMINDER_QUEUE_NAME = "appointment-reminders";
export const APPOINTMENT_REMINDER_LEAD_TIME_MS = 60 * 60 * 1000;

export interface AppointmentReminderJobData {
  appointmentId: string;
}

// Randevudan 1 saat önce tetiklenecek hatırlatma job'ını yönetir (bkz. BACKEND.md §9).
// jobId olarak appointmentId kullanılır — aynı randevu için tekrar schedule edilirse
// (veya iptal edilirse) mevcut job idempotent şekilde bulunup kaldırılabilir.
@Injectable()
export class AppointmentReminderQueue implements OnModuleDestroy {
  private readonly queue: Queue<AppointmentReminderJobData>;

  constructor(config: ConfigService<Env, true>) {
    const connection = new IORedis(config.get("REDIS_URL", { infer: true }), { maxRetriesPerRequest: null });
    this.queue = new Queue(APPOINTMENT_REMINDER_QUEUE_NAME, { connection });
  }

  async scheduleReminder(appointmentId: string, scheduledAt: Date): Promise<void> {
    const delay = scheduledAt.getTime() - APPOINTMENT_REMINDER_LEAD_TIME_MS - Date.now();
    if (delay <= 0) {
      return;
    }
    await this.queue.add(
      "reminder",
      { appointmentId },
      { jobId: appointmentId, delay, removeOnComplete: true, removeOnFail: true },
    );
  }

  async cancelReminder(appointmentId: string): Promise<void> {
    const job = await this.queue.getJob(appointmentId);
    if (job) {
      await job.remove();
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.queue.close();
  }
}
