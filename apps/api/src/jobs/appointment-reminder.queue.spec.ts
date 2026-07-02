const addMock = jest.fn();
const getJobMock = jest.fn();
const closeMock = jest.fn();

jest.mock("bullmq", () => ({
  Queue: jest.fn().mockImplementation(() => ({
    add: addMock,
    getJob: getJobMock,
    close: closeMock,
  })),
}));

jest.mock("ioredis", () => jest.fn().mockImplementation(() => ({})));

import { ConfigService } from "@nestjs/config";
import { AppointmentReminderQueue, APPOINTMENT_REMINDER_LEAD_TIME_MS } from "./appointment-reminder.queue";

describe("AppointmentReminderQueue", () => {
  let queue: AppointmentReminderQueue;
  const config = { get: jest.fn().mockReturnValue("redis://localhost:6379") };

  beforeEach(() => {
    jest.clearAllMocks();
    config.get.mockReturnValue("redis://localhost:6379");
    queue = new AppointmentReminderQueue(config as unknown as ConfigService<never, true>);
  });

  describe("scheduleReminder", () => {
    it("randevu 1 saatten fazla uzaktaysa doğru gecikmeyle job ekler", async () => {
      const scheduledAt = new Date(Date.now() + 2 * APPOINTMENT_REMINDER_LEAD_TIME_MS);
      await queue.scheduleReminder("appt-1", scheduledAt);

      expect(addMock).toHaveBeenCalledTimes(1);
      const [name, data, opts] = addMock.mock.calls[0];
      expect(name).toBe("reminder");
      expect(data).toEqual({ appointmentId: "appt-1" });
      expect(opts.jobId).toBe("appt-1");
      expect(opts.delay).toBeGreaterThan(0);
    });

    it("randevu 1 saatten az uzaktaysa job eklemez", async () => {
      const scheduledAt = new Date(Date.now() + 30 * 60 * 1000);
      await queue.scheduleReminder("appt-1", scheduledAt);
      expect(addMock).not.toHaveBeenCalled();
    });
  });

  describe("cancelReminder", () => {
    it("job varsa kaldırır", async () => {
      const removeMock = jest.fn();
      getJobMock.mockResolvedValue({ remove: removeMock });

      await queue.cancelReminder("appt-1");
      expect(removeMock).toHaveBeenCalledTimes(1);
    });

    it("job yoksa hata fırlatmaz", async () => {
      getJobMock.mockResolvedValue(null);
      await expect(queue.cancelReminder("appt-1")).resolves.toBeUndefined();
    });
  });
});
